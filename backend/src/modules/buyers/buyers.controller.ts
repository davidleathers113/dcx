// src/modules/buyers/buyers.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient, Status as StatusEnum } from '@prisma/client';
import type { components } from '@/types/api';

const prisma = new PrismaClient();
const buyersRouter = express.Router();

type BuyerApi = components['schemas']['Buyer'];

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
 * GET /api/buyers
 * Fetch paginated buyers with optional status filtering.
 * Fully integrated endpoint with Prisma database queries.
 */
buyersRouter.get('/buyers', async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePageLimit(req);
    const status = parseStatus(req.query.status);

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [items, total] = await prisma.$transaction([
      prisma.buyer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.buyer.count({ where })
    ]);

    const response: {
      data: BuyerApi[];
      meta: { total: number; page: number; limit: number };
    } = {
      data: items as unknown as BuyerApi[],
      meta: { total, page, limit }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching buyers:', error);
    res.status(500).json({
      message: 'Failed to fetch buyers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { buyersRouter };
