// src/modules/traffic/traffic.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const trafficRouter = express.Router();

trafficRouter.get('/traffic-sources', async (_req: Request, res: Response) => {
  const sources = await prisma.trafficSource.findMany({ include: { supplier: true } });
  const callCounts = await prisma.callSession.groupBy({
    by: ['trafficSourceId'],
    _count: { _all: true }
  });

  res.json(
    sources.map((source) => {
      const match = callCounts.find((count) => count.trafficSourceId === source.id);
      return {
        id: source.id,
        name: source.name,
        channel: source.channel,
        supplier: source.supplier?.name ?? 'Unassigned',
        status: source.status,
        cplCents: source.cplCents,
        calls: match?._count._all ?? 0
      };
    })
  );
});
