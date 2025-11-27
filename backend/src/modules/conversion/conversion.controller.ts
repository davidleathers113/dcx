// src/modules/conversion/conversion.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { components } from '@/types/api';

const prisma = new PrismaClient();

type ConversionCreateReq =
  components['schemas']['ConversionEventCreateRequest'];
type ConversionCreateRes =
  components['schemas']['ConversionEventCreateResponse'];

export const conversionRouter = express.Router();

/**
 * POST /api/conversions
 *
 * Buyer → DCX conversion webhook.
 * - Looks up CallSession by call_public_id.
 * - Validates buyer_id matches the call’s buyerId.
 * - Inserts a ConversionEvent.
 * - Economics: if revenue_cents from this event is greater than
 *   current revenueEstimatedCents, update the CallSession.
 */
conversionRouter.post(
  '/conversions',
  async (req: Request, res: Response) => {
    const body = req.body as ConversionCreateReq;

    if (!body.call_public_id || !body.buyer_id || !body.event_type || !body.event_time) {
      return res.status(400).json({
        message:
          'call_public_id, buyer_id, event_type, and event_time are required'
      });
    }

    // 1) Fetch CallSession by public ID (external-safe identifier)
    const session = await prisma.callSession.findUnique({
      where: { publicId: body.call_public_id },
      include: {
        offer: true
      }
    });

    if (!session) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // 2) Validate buyer_id matches
    if (!session.buyerId || session.buyerId !== body.buyer_id) {
      return res.status(400).json({
        message:
          'buyer_id does not match the buyer associated with this call'
      });
    }

    // 3) Insert ConversionEvent
    const revenueCentsFromEvent =
      typeof body.revenue_cents === 'number' ? body.revenue_cents : null;

    const conversion = await prisma.conversionEvent.create({
      data: {
        callSessionId: session.id,
        buyerId: body.buyer_id,
        eventType: body.event_type,
        eventTime: new Date(body.event_time),
        revenueCents: revenueCentsFromEvent,
        source: 'BUYER_WEBHOOK'
      }
    });

    // 4) Economics: bump revenueEstimatedCents if this event yields more revenue
    if (
      typeof revenueCentsFromEvent === 'number' &&
      revenueCentsFromEvent > session.revenueEstimatedCents
    ) {
      await prisma.callSession.update({
        where: { id: session.id },
        data: {
          revenueEstimatedCents: revenueCentsFromEvent
        }
      });
    }

    const response: ConversionCreateRes = {
      id: conversion.id,
      call_session_id: conversion.callSessionId,
      status: 'ACCEPTED'
    };

    return res.status(201).json(response);
  }
);
