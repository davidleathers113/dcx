// src/modules/schedules/schedules.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const schedulesRouter = express.Router();

schedulesRouter.get('/schedules', async (_req: Request, res: Response) => {
  const rules = await prisma.scheduleRule.findMany({ orderBy: { targetId: 'asc' } });
  res.json(rules);
});

schedulesRouter.get('/dashboards/schedules', async (_req: Request, res: Response) => {
  const rules = await prisma.scheduleRule.findMany();
  const buyersOnline = rules.filter((rule) => rule.targetType === 'BUYER' && rule.status === 'ACTIVE').length;
  const buyerTotal = rules.filter((rule) => rule.targetType === 'BUYER').length || 1;

  res.json({
    buyersOnline,
    buyerTotal,
    adherence: Number(((buyersOnline / buyerTotal) * 100).toFixed(1)),
    blackoutRules: rules.filter((rule) => rule.status === 'INACTIVE').length
  });
});
