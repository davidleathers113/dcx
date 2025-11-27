// src/modules/suppliers/suppliers.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient, Status as StatusEnum, SupplierType } from '@prisma/client';
import type { components } from '@/types/api';

const prisma = new PrismaClient();
const suppliersRouter = express.Router();

type SupplierApi = components['schemas']['Supplier'];

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

/* Helper: Parse supplier type enum */
function parseSupplierType(value: unknown): SupplierType | undefined {
  if (!value) return undefined;
  const s = Array.isArray(value) ? value[0] : String(value);
  if ((Object.values(SupplierType) as string[]).includes(s)) {
    return s as SupplierType;
  }
  return undefined;
}

/**
 * GET /api/suppliers
 * Fetch paginated suppliers with optional status and type filtering.
 * Fully integrated endpoint with Prisma database queries.
 */
suppliersRouter.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const { page, limit } = parsePageLimit(req);
    const status = parseStatus(req.query.status);
    const type = parseSupplierType(req.query.type);

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (type) {
      where.type = type;
    }

    const [items, total] = await prisma.$transaction([
      prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.supplier.count({ where })
    ]);

    const response: {
      data: SupplierApi[];
      meta: { total: number; page: number; limit: number };
    } = {
      data: items as unknown as SupplierApi[],
      meta: { total, page, limit }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      message: 'Failed to fetch suppliers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { suppliersRouter };
