// src/modules/routing/routing.controller.ts
import express, { Request, Response } from 'express';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

export const routingRouter = express.Router();

/**
 * POST /internal/routing/decide
 *
 * Internal-only endpoint.
 * Given campaign/supplier/call metadata, returns which buyer/offer to use
 * and the destination endpoint details.
 *
 * In production you'll:
 *  - Lookup active offers for the campaign
 *  - Filter by caps, schedule, concurrency
 *  - Apply priority/weight routing logic
 */
routingRouter.post('/routing/decide', async (req: Request, res: Response) => {
  const {
    campaign_id,
    supplier_id,
    from_number,
    to_number,
    geo,
    timestamp
  } = req.body || {};

  if (!campaign_id || !supplier_id || !from_number || !to_number) {
    return res.status(400).json({
      message: 'Missing required fields: campaign_id, supplier_id, from_number, to_number'
    });
  }

  // TODO: Replace this stub with real Prisma-based routing logic.
  // Example shape of the query you'll eventually write:
  //
  // const offers = await prisma.offer.findMany({
  //   where: {
  //     campaignId: campaign_id,
  //     isActive: true
  //   },
  //   orderBy: [
  //     { priority: 'asc' },
  //     { weight: 'desc' }
  //   ],
  //   include: {
  //     buyer: true
  //   }
  // });
  //
  // Then filter by schedule/caps/concurrency and pick one.

  // For now, respond with a deterministic stub so you can wire Twilio → internal routing.
  const mockResponse = {
    buyer_id: 'buyer_stub_123',
    offer_id: 'offer_stub_abc',
    destination_type: 'PHONE_NUMBER',
    destination_value: '+15550001111',
    max_ring_seconds: 30,
    max_call_duration_seconds: 1800
  };

  return res.status(200).json(mockResponse);
});
