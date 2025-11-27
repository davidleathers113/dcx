// src/modules/admin/admin.controller.ts
import express, { Request, Response } from 'express';
import {
  PrismaClient,
  Status,
  EndpointType,
  PricingModel
} from '@prisma/client';
import type { components } from '@/types/api';

const prisma = new PrismaClient();

// OpenAPI-generated types
type Campaign = components['schemas']['Campaign'];
type CampaignInput = components['schemas']['CampaignInput'];
type CampaignUpdate = components['schemas']['CampaignUpdate'];

type Buyer = components['schemas']['Buyer'];
type BuyerInput = components['schemas']['BuyerInput'];
type BuyerUpdate = components['schemas']['BuyerUpdate'];

type Offer = components['schemas']['Offer'];
type OfferInput = components['schemas']['OfferInput'];
type OfferUpdate = components['schemas']['OfferUpdate'];

export const adminRouter = express.Router();

/* Helpers */

function parseStatusQuery(value: unknown): Status | undefined {
  if (!value) return undefined;
  const s = Array.isArray(value) ? value[0] : String(value);
  return s === 'ACTIVE' || s === 'INACTIVE' ? (s as Status) : undefined;
}

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

/* Mappers from OpenAPI input → Prisma */

function mapCampaignInput(input: CampaignInput): {
  name: string;
  vertical: string;
  geoRules?: any | null;
  supplierId?: string | null;
  status?: Status;
  recordingDefaultEnabled?: boolean;
} {
  return {
    name: input.name,
    vertical: input.vertical,
    geoRules: input.geo_rules ?? null,
    supplierId: input.supplier_id ?? null,
    status: (input.status as Status | undefined) ?? Status.ACTIVE,
    recordingDefaultEnabled:
      input.recording_default_enabled !== undefined
        ? input.recording_default_enabled
        : true
  };
}

function mapCampaignUpdate(input: CampaignUpdate): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.vertical !== undefined) data.vertical = input.vertical;
  if (input.geo_rules !== undefined) data.geoRules = input.geo_rules;
  if (input.supplier_id !== undefined) data.supplierId = input.supplier_id;
  if (input.status !== undefined) data.status = input.status as Status;
  if (input.recording_default_enabled !== undefined) {
    data.recordingDefaultEnabled = input.recording_default_enabled;
  }
  return data;
}

function mapBuyerInput(input: BuyerInput): {
  name: string;
  endpointType: EndpointType;
  endpointValue: string;
  concurrencyLimit: number;
  dailyCap?: number | null;
  status?: Status;
  weight?: number;
  scheduleTimezone?: string | null;
  scheduleRules?: any | null;
} {
  return {
    name: input.name,
    endpointType: input.endpoint_type as EndpointType,
    endpointValue: input.endpoint_value,
    concurrencyLimit: input.concurrency_limit,
    dailyCap: input.daily_cap ?? null,
    status: (input.status as Status | undefined) ?? Status.ACTIVE,
    weight: input.weight ?? 50,
    scheduleTimezone: input.schedule_timezone ?? null,
    scheduleRules: input.schedule_rules ?? null
  };
}

function mapBuyerUpdate(input: BuyerUpdate): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.endpoint_type !== undefined) {
    data.endpointType = input.endpoint_type as EndpointType;
  }
  if (input.endpoint_value !== undefined) {
    data.endpointValue = input.endpoint_value;
  }
  if (input.concurrency_limit !== undefined) {
    data.concurrencyLimit = input.concurrency_limit;
  }
  if (input.daily_cap !== undefined) {
    data.dailyCap = input.daily_cap;
  }
  if (input.status !== undefined) data.status = input.status as Status;
  if (input.weight !== undefined) data.weight = input.weight;
  if (input.schedule_timezone !== undefined) {
    data.scheduleTimezone = input.schedule_timezone;
  }
  if (input.schedule_rules !== undefined) {
    data.scheduleRules = input.schedule_rules;
  }
  return data;
}

function mapOfferInput(input: OfferInput): {
  buyerId: string;
  campaignId: string;
  pricingModel: PricingModel;
  payoutCents: number;
  bufferSeconds?: number;
  attributionWindowDays?: number;
  dailyCap?: number | null;
  priority?: number;
  weight?: number;
  isActive?: boolean;
} {
  return {
    buyerId: input.buyer_id,
    campaignId: input.campaign_id,
    pricingModel: input.pricing_model as PricingModel,
    payoutCents: input.payout_cents,
    bufferSeconds: input.buffer_seconds ?? 60,
    attributionWindowDays: input.attribution_window_days ?? 30,
    dailyCap: input.daily_cap ?? null,
    priority: input.priority ?? 100,
    weight: input.weight ?? 50,
    isActive: input.is_active ?? true
  };
}

function mapOfferUpdate(input: OfferUpdate): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (input.pricing_model !== undefined) {
    data.pricingModel = input.pricing_model as PricingModel;
  }
  if (input.payout_cents !== undefined) data.payoutCents = input.payout_cents;
  if (input.buffer_seconds !== undefined) data.bufferSeconds = input.buffer_seconds;
  if (input.attribution_window_days !== undefined) {
    data.attributionWindowDays = input.attribution_window_days;
  }
  if (input.daily_cap !== undefined) data.dailyCap = input.daily_cap;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.weight !== undefined) data.weight = input.weight;
  if (input.is_active !== undefined) data.isActive = input.is_active;
  return data;
}

/* CAMPAIGNS */

// GET /api/campaigns
adminRouter.get('/campaigns', async (req: Request, res: Response) => {
  const { page, limit } = parsePageLimit(req);
  const status = parseStatusQuery(req.query.status);

  const where: any = {};
  if (status) where.status = status;

  const [items, total] = await prisma.$transaction([
    prisma.campaign.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.campaign.count({ where })
  ]);

  const response: { data: Campaign[]; meta: { total: number; page: number; limit: number } } =
    {
      data: items as unknown as Campaign[],
      meta: { total, page, limit }
    };

  res.json(response);
});

// GET /api/campaigns/:id
adminRouter.get('/campaigns/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });

  if (!campaign) {
    return res.status(404).json({ message: 'Campaign not found' });
  }

  res.json(campaign as unknown as Campaign);
});

// POST /api/campaigns
adminRouter.post('/campaigns', async (req: Request, res: Response) => {
  const body = req.body as CampaignInput;

  if (!body.name || !body.vertical) {
    return res.status(400).json({ message: 'name and vertical are required' });
  }

  const data = mapCampaignInput(body);

  const created = await prisma.campaign.create({ data });

  res.status(201).json(created as unknown as Campaign);
});

// PATCH /api/campaigns/:id
adminRouter.patch('/campaigns/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as CampaignUpdate;

  const data = mapCampaignUpdate(body);
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'No updatable fields provided' });
  }

  try {
    const updated = await prisma.campaign.update({
      where: { id },
      data
    });
    res.json(updated as unknown as Campaign);
  } catch {
    res.status(404).json({ message: 'Campaign not found' });
  }
});

/* BUYERS */

// GET /api/buyers
adminRouter.get('/buyers', async (req: Request, res: Response) => {
  const { page, limit } = parsePageLimit(req);
  const status = parseStatusQuery(req.query.status);

  const where: any = {};
  if (status) where.status = status;

  const [items, total] = await prisma.$transaction([
    prisma.buyer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.buyer.count({ where })
  ]);

  const response: { data: Buyer[]; meta: { total: number; page: number; limit: number } } =
    {
      data: items as unknown as Buyer[],
      meta: { total, page, limit }
    };

  res.json(response);
});

// GET /api/buyers/:id
adminRouter.get('/buyers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const buyer = await prisma.buyer.findUnique({ where: { id } });

  if (!buyer) {
    return res.status(404).json({ message: 'Buyer not found' });
  }

  res.json(buyer as unknown as Buyer);
});

// POST /api/buyers
adminRouter.post('/buyers', async (req: Request, res: Response) => {
  const body = req.body as BuyerInput;

  if (
    !body.name ||
    !body.endpoint_type ||
    !body.endpoint_value ||
    !body.concurrency_limit
  ) {
    return res.status(400).json({
      message:
        'name, endpoint_type, endpoint_value, and concurrency_limit are required'
    });
  }

  const data = mapBuyerInput(body);

  const created = await prisma.buyer.create({ data });

  res.status(201).json(created as unknown as Buyer);
});

// PATCH /api/buyers/:id
adminRouter.patch('/buyers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as BuyerUpdate;

  const data = mapBuyerUpdate(body);
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'No updatable fields provided' });
  }

  try {
    const updated = await prisma.buyer.update({
      where: { id },
      data
    });
    res.json(updated as unknown as Buyer);
  } catch {
    res.status(404).json({ message: 'Buyer not found' });
  }
});

/* OFFERS */

// GET /api/offers
adminRouter.get('/offers', async (req: Request, res: Response) => {
  const { page, limit } = parsePageLimit(req);
  const buyerIdRaw = req.query.buyer_id;
  const campaignIdRaw = req.query.campaign_id;

  const where: any = {};
  if (buyerIdRaw) {
    where.buyerId = Array.isArray(buyerIdRaw)
      ? buyerIdRaw[0]
      : String(buyerIdRaw);
  }
  if (campaignIdRaw) {
    where.campaignId = Array.isArray(campaignIdRaw)
      ? campaignIdRaw[0]
      : String(campaignIdRaw);
  }

  const [items, total] = await prisma.$transaction([
    prisma.offer.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.offer.count({ where })
  ]);

  const response: { data: Offer[]; meta: { total: number; page: number; limit: number } } =
    {
      data: items as unknown as Offer[],
      meta: { total, page, limit }
    };

  res.json(response);
});

// GET /api/offers/:id
adminRouter.get('/offers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const offer = await prisma.offer.findUnique({ where: { id } });

  if (!offer) {
    return res.status(404).json({ message: 'Offer not found' });
  }

  res.json(offer as unknown as Offer);
});

// POST /api/offers
adminRouter.post('/offers', async (req: Request, res: Response) => {
  const body = req.body as OfferInput;

  if (!body.buyer_id || !body.campaign_id || !body.pricing_model) {
    return res.status(400).json({
      message: 'buyer_id, campaign_id, and pricing_model are required'
    });
  }

  if (body.payout_cents === undefined) {
    return res.status(400).json({ message: 'payout_cents is required' });
  }

  const data = mapOfferInput(body);

  const created = await prisma.offer.create({ data });

  res.status(201).json(created as unknown as Offer);
});

// PATCH /api/offers/:id
adminRouter.patch('/offers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as OfferUpdate;

  const data = mapOfferUpdate(body);
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'No updatable fields provided' });
  }

  try {
    const updated = await prisma.offer.update({
      where: { id },
      data
    });
    res.json(updated as unknown as Offer);
  } catch {
    res.status(404).json({ message: 'Offer not found' });
  }
});
