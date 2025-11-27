// src/modules/sms/sms.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient, SmsDirection } from '@prisma/client';

const prisma = new PrismaClient();
export const smsRouter = express.Router();

smsRouter.get('/sms', async (_req: Request, res: Response) => {
  const [messages, blasts, optOuts, registrations] = await Promise.all([
    prisma.smsMessage.findMany(),
    prisma.smsBlast.findMany(),
    prisma.smsOptOut.findMany(),
    prisma.messagingRegistration.findMany()
  ]);

  const sent = messages.filter((msg) => msg.direction === SmsDirection.OUTBOUND).length;
  const received = messages.filter((msg) => msg.direction === SmsDirection.INBOUND).length;

  res.json({
    totals: {
      sent,
      received,
      blasts: blasts.length,
      optOuts: optOuts.length,
      registrations: registrations.length
    }
  });
});

smsRouter.get('/sms/messages', async (req: Request, res: Response) => {
  const directionParam = req.query.direction ? String(req.query.direction) : undefined;
  const directionFilter =
    directionParam && (Object.values(SmsDirection) as string[]).includes(directionParam)
      ? (directionParam as SmsDirection)
      : undefined;
  const where = directionFilter ? { direction: directionFilter } : undefined;
  const messages = await prisma.smsMessage.findMany({
    where,
    orderBy: { occurredAt: 'desc' },
    take: Number(req.query.limit ?? 100),
    include: { lead: true }
  });

  res.json(
    messages.map((message) => ({
      id: message.id,
      direction: message.direction,
      phone: message.phone,
      status: message.status,
      body: message.body,
      lead: message.lead ? `${message.lead.firstName ?? ''} ${message.lead.lastName ?? ''}`.trim() : null,
      occurredAt: message.occurredAt.toISOString()
    }))
  );
});

smsRouter.get('/sms/blasts', async (_req: Request, res: Response) => {
  const blasts = await prisma.smsBlast.findMany({ orderBy: { updatedAt: 'desc' } });
  res.json(
    blasts.map((blast) => ({
      id: blast.id,
      name: blast.name,
      status: blast.status,
      audienceSize: blast.audienceSize,
      sentCount: blast.sentCount,
      failedCount: blast.failedCount,
      scheduledAt: blast.scheduledAt ? blast.scheduledAt.toISOString() : null,
      template: blast.template
    }))
  );
});
