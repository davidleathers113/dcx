// src/modules/campaigns/campaigns.controller.ts
import express, { Request, Response } from 'express';
import { Prisma, PrismaClient, Status as StatusEnum } from '@prisma/client';
import type { components } from '@/types/api';
import crypto from 'crypto';

const prisma = new PrismaClient();
const campaignsRouter = express.Router();

type CampaignApi = components['schemas']['Campaign'];

/* Helper: Parse pagination parameters */
function parsePageLimit(req: Request): { page: number; limit: number } {
  const pageRaw = req.query.page;
  const limitRaw = req.query.limit;

  let page = pageRaw ? Number(Array.isArray(pageRaw) ? pageRaw[0] : pageRaw) : 1;
  let limit = limitRaw ? Number(Array.isArray(limitRaw) ? limitRaw[0] : limitRaw) : 50;

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = 50;
  if (limit > 500) limit = 500;

  return { page, limit };
}

/**
 * buildCampaignWhereClause
 * Dynamically builds a Prisma Where clause from request query filters.
 */
function buildCampaignWhereClause(filters: any = {}): Prisma.CampaignWhereInput {
    const where: Prisma.CampaignWhereInput = {};

    // Status filter (multi-select)
    if (filters.status) {
        const statuses = String(filters.status).split(',').filter(s => ['ACTIVE', 'INACTIVE'].includes(s));
        if (statuses.length > 0) {
            where.status = { in: statuses as StatusEnum[] };
        }
    }

    // Vertical filter (multi-select)
    if (filters.vertical) {
        const verticals = String(filters.vertical).split(',');
        if (verticals.length > 0) {
            where.vertical = { in: verticals };
        }
    }
    
    // Created Date Range filter
    const createdAt: Prisma.DateTimeFilter = {};
    if (filters.created_from) {
        createdAt.gte = new Date(String(filters.created_from));
    }
    if (filters.created_to) {
        createdAt.lte = new Date(String(filters.created_to));
    }
    if (Object.keys(createdAt).length > 0) {
        where.createdAt = createdAt;
    }

    // Has Active Buyers filter
    if (filters.has_active_buyers === 'true') {
        where.offers = {
            some: {
                isActive: true,
                buyer: {
                    status: 'ACTIVE'
                }
            }
        };
    }

    return where;
}


/**
 * GET /api/campaigns
 * Fetch paginated campaigns with advanced filtering.
 */
campaignsRouter.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePageLimit(req);
    const where = buildCampaignWhereClause(req.query.filters);

    const [items, total] = await prisma.$transaction([
      prisma.campaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            // Optionally include related data if needed for display
            _count: {
                select: { offers: true, numbers: true }
            }
        }
      }),
      prisma.campaign.count({ where })
    ]);

    const response: {
      data: CampaignApi[];
      meta: { total: number; page: number; limit: number };
    } = {
      data: items as unknown as CampaignApi[],
      meta: { total, page, limit }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      message: 'Failed to fetch campaigns',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/campaigns
 * Create a new campaign, generating API keys.
 */
campaignsRouter.post('/campaigns', async (req: Request, res: Response) => {
  try {
    const { name, vertical, status } = req.body;

    if (!name || !vertical) {
      return res.status(400).json({ message: 'Missing required fields: name, vertical' });
    }

    const newCampaign = await prisma.campaign.create({
      data: {
        name,
        vertical,
        status: status || 'INACTIVE',
        leadsApiKey: crypto.randomUUID(),
        numbersApiKey: crypto.randomUUID(),
      },
    });

    res.status(201).json(newCampaign as unknown as CampaignApi);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      message: 'Failed to create campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/campaigns/:id/regenerate-keys
 * Regenerate API keys for a specific campaign.
 */
campaignsRouter.post('/campaigns/:id/regenerate-keys', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: {
        leadsApiKey: crypto.randomUUID(),
        numbersApiKey: crypto.randomUUID(),
      },
    });

    res.json(updatedCampaign as unknown as CampaignApi);
  } catch (error) {
    console.error(`Error regenerating keys for campaign ${req.params.id}:`, error);
    if (error instanceof Error && (error as any).code === 'P2025') { // Prisma code for record not found
        return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(500).json({
      message: 'Failed to regenerate keys',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/campaigns/bulk-update
 * Perform bulk actions (pause, activate, delete) on a set of campaigns.
 */
campaignsRouter.post('/campaigns/bulk-update', async (req: Request, res: Response) => {
  try {
    const { campaign_ids, action, reason } = req.body;

    if (!Array.isArray(campaign_ids) || campaign_ids.length === 0) {
      return res.status(400).json({ message: 'campaign_ids must be a non-empty array.' });
    }

    if (!['pause', 'activate', 'delete'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action specified.' });
    }

    let count = 0;
    
    // Use a transaction to ensure atomicity of the operation and the audit log
    await prisma.$transaction(async (tx) => {
      if (action === 'pause' || action === 'activate') {
        const newStatus = action === 'pause' ? 'INACTIVE' : 'ACTIVE';
        const { count: updatedCount } = await tx.campaign.updateMany({
          where: { id: { in: campaign_ids } },
          data: { status: newStatus },
        });
        count = updatedCount;
      } else if (action === 'delete') {
        const { count: deletedCount } = await tx.campaign.deleteMany({
          where: { id: { in: campaign_ids } },
        });
        count = deletedCount;
      }

      // Create audit log entries for all affected campaigns
      const auditLogs = campaign_ids.map(campaignId => ({
        campaignId,
        action: `bulk-${action}`,
        reason,
        // userId: req.user.id, // TODO: Add once auth is in place
        details: {
          count: campaign_ids.length,
          action,
        }
      }));

      await tx.campaignAuditLog.createMany({
        data: auditLogs,
      });
    });

    res.json({ message: `Successfully performed ${action} on ${count} campaigns.` });

  } catch (error) {
    console.error('Error performing bulk update on campaigns:', error);
    res.status(500).json({
      message: 'Failed to perform bulk update',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { campaignsRouter };
