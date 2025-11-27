// src/modules/leads/leads.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const leadsRouter = express.Router();

leadsRouter.get('/leads', async (_req: Request, res: Response) => {
  const leads = await prisma.lead.findMany({
    include: { campaign: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  res.json(
    leads.map((lead) => ({
      id: lead.id,
      name: [lead.firstName, lead.lastName].filter(Boolean).join(' ').trim() || 'N/A',
      stage: lead.stage,
      phone: lead.phone,
      source: lead.source,
      campaign: lead.campaign?.name ?? 'Unassigned',
      score: lead.score,
      createdAt: lead.createdAt.toISOString()
    }))
  );
});

leadsRouter.get('/leads/report', async (_req: Request, res: Response) => {
  const leads = await prisma.lead.findMany({ include: { campaign: true } });
  const events = await prisma.leadEvent.findMany();

  const byCampaign = new Map<string, { total: number; qualified: number }>();
  leads.forEach((lead) => {
    const key = lead.campaign?.name ?? 'Unassigned';
    const entry = byCampaign.get(key) ?? { total: 0, qualified: 0 };
    entry.total += 1;
    if (lead.stage === 'QUALIFIED' || lead.stage === 'CONVERTED') {
      entry.qualified += 1;
    }
    byCampaign.set(key, entry);
  });

  res.json({
    totals: {
      totalLeads: leads.length,
      qualified: leads.filter((lead) => lead.stage === 'QUALIFIED' || lead.stage === 'CONVERTED').length,
      events: events.length
    },
    campaigns: Array.from(byCampaign.entries()).map(([campaignName, value]) => ({
      campaign: campaignName,
      total: value.total,
      qualified: value.qualified
    }))
  });
});

leadsRouter.get('/leads/imports', async (_req: Request, res: Response) => {
  const jobs = await prisma.leadImportJob.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(jobs);
});

leadsRouter.get('/leads/retargets', async (_req: Request, res: Response) => {
  const lists = await prisma.retargetList.findMany({
    include: { campaign: true },
    orderBy: { updatedAt: 'desc' }
  });

  res.json(
    lists.map((list) => ({
      id: list.id,
      name: list.name,
      campaign: list.campaign?.name ?? 'All Campaigns',
      size: list.size,
      healthScore: list.healthScore,
      lastPushAt: list.lastPushAt ? list.lastPushAt.toISOString() : null,
      status: list.status,
      rules: list.rules
    }))
  );
});
