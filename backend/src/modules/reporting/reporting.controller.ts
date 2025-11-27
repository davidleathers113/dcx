// src/modules/reporting/reporting.controller.ts
import express, { Request, Response } from 'express';
import {
  PrismaClient,
  CallStatus as CallStatusEnum,
  Status as StatusEnum
} from '@prisma/client';
import type { components } from '@/types/api';

const prisma = new PrismaClient();

type CallSessionApi = components['schemas']['CallSession'];
type PhoneNumberApi = components['schemas']['PhoneNumber'];

export const reportingRouter = express.Router();

/* Helpers */

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

function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const s = Array.isArray(value) ? value[0] : String(value);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseCallStatus(value: unknown): CallStatusEnum | undefined {
  if (!value) return undefined;
  const s = Array.isArray(value) ? value[0] : String(value);
  if ((Object.values(CallStatusEnum) as string[]).includes(s)) {
    return s as CallStatusEnum;
  }
  return undefined;
}

function parseStatus(value: unknown): StatusEnum | undefined {
  if (!value) return undefined;
  const s = Array.isArray(value) ? value[0] : String(value);
  if (s === 'ACTIVE' || s === 'INACTIVE') {
    return s as StatusEnum;
  }
  return undefined;
}

/* GET /api/calls */
reportingRouter.get('/calls', async (req: Request, res: Response) => {
  const { page, limit } = parsePageLimit(req);

  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to);
  const campaignIdRaw = req.query.campaign_id;
  const supplierIdRaw = req.query.supplier_id;
  const buyerIdRaw = req.query.buyer_id;
  const status = parseCallStatus(req.query.status);

  const where: any = {};

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  if (campaignIdRaw) {
    where.campaignId = Array.isArray(campaignIdRaw)
      ? campaignIdRaw[0]
      : String(campaignIdRaw);
  }

  if (supplierIdRaw) {
    where.supplierId = Array.isArray(supplierIdRaw)
      ? supplierIdRaw[0]
      : String(supplierIdRaw);
  }

  if (buyerIdRaw) {
    where.buyerId = Array.isArray(buyerIdRaw)
      ? buyerIdRaw[0]
      : String(buyerIdRaw);
  }

  if (status) {
    where.status = status;
  }

  const [items, total] = await prisma.$transaction([
    prisma.callSession.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.callSession.count({ where })
  ]);

  const response: {
    data: CallSessionApi[];
    meta: { total: number; page: number; limit: number };
  } = {
    data: items as unknown as CallSessionApi[],
    meta: { total, page, limit }
  };

  res.json(response);
});

/* GET /api/numbers */
reportingRouter.get('/numbers', async (req: Request, res: Response) => {
  const { page, limit } = parsePageLimit(req);

  const campaignIdRaw = req.query.campaign_id;
  const supplierIdRaw = req.query.supplier_id;
  const status = parseStatus(req.query.status);

  const where: any = {};

  if (campaignIdRaw) {
    where.campaignId = Array.isArray(campaignIdRaw)
      ? campaignIdRaw[0]
      : String(campaignIdRaw);
  }

  if (supplierIdRaw) {
    where.supplierId = Array.isArray(supplierIdRaw)
      ? supplierIdRaw[0]
      : String(supplierIdRaw);
  }

  if (status) {
    where.status = status;
  }

  const [items, total] = await prisma.$transaction([
    prisma.phoneNumber.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.phoneNumber.count({ where })
  ]);

  const response: {
    data: PhoneNumberApi[];
    meta: { total: number; page: number; limit: number };
  } = {
    data: items as unknown as PhoneNumberApi[],
    meta: { total, page, limit }
  };

  res.json(response);
});
