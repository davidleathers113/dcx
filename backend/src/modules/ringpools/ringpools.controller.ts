// src/modules/ringpools/ringpools.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const ringPoolsRouter = express.Router();

ringPoolsRouter.get('/ring-pools', async (_req: Request, res: Response) => {
  const [pools, numbers] = await Promise.all([
    prisma.ringPool.findMany({ include: { campaign: true, supplier: true } }),
    prisma.phoneNumber.findMany()
  ]);

  res.json(
    pools.map((pool) => {
      const poolNumbers = numbers.filter((num) => num.ringPoolId === pool.id);
      return {
        id: pool.id,
        label: pool.label,
        campaign: pool.campaign?.name ?? 'Unassigned',
        supplier: pool.supplier?.name ?? 'Unassigned',
        mode: pool.mode,
        targetSize: pool.targetSize,
        healthyCount: pool.healthyCount,
        assignedNumbers: poolNumbers.map((num) => num.e164)
      };
    })
  );
});
