// src/modules/campaigns/campaigns.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient, Status as StatusEnum } from '@prisma/client';
import type { components } from '@/types/api';

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

/* Helper: Parse status enum */
function parseStatus(value: unknown): StatusEnum | undefined {
  if (!value) return undefined;
  const s = Array.isArray(value) ? value[0] : String(value);
  if (s === 'ACTIVE' || s === 'INACTIVE') {
    return s as StatusEnum;
  }
  return undefined;
}

/**
 * GET /api/campaigns
 * Fetch paginated campaigns with optional status filtering.
 * Fully integrated endpoint with Prisma database queries.
 */
campaignsRouter.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePageLimit(req);
    const status = parseStatus(req.query.status);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [items, total] = await prisma.$transaction([
      prisma.campaign.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
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

export { campaignsRouter };
