// src/modules/billing/billing.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient, SmsDirection } from '@prisma/client';

const prisma = new PrismaClient();
export const billingRouter = express.Router();

billingRouter.get('/billing/statements', async (_req: Request, res: Response) => {
  const statements = await prisma.billingStatement.findMany({
    orderBy: { periodEnd: 'desc' }
  });
  res.json(statements);
});

billingRouter.get('/billing/payments', async (_req: Request, res: Response) => {
  const payments = await prisma.billingPayment.findMany({ orderBy: { receivedAt: 'desc' } });
  res.json(payments);
});

billingRouter.get('/billing/rates', async (_req: Request, res: Response) => {
  const rates = await prisma.carrierRate.findMany({ orderBy: { carrier: 'asc' } });
  res.json(rates);
});

billingRouter.get('/billing/usage', async (req: Request, res: Response) => {
  const days = Number(req.query.days ?? 30);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [calls, sms] = await Promise.all([
    prisma.callSession.findMany({ where: { createdAt: { gte: since } } }),
    prisma.smsMessage.findMany({ where: { createdAt: { gte: since } } })
  ]);

  const voiceMinutes = calls.reduce((sum, call) => sum + (call.billableDurationSeconds ?? 0), 0) / 60;
  const voiceCost = calls.reduce((sum, call) => sum + (call.telephonyCostCents ?? 0), 0);

  const smsOutgoing = sms.filter((m) => m.direction === SmsDirection.OUTBOUND).length;
  const smsIncoming = sms.filter((m) => m.direction === SmsDirection.INBOUND).length;

  res.json({
    voiceMinutes: Number(voiceMinutes.toFixed(2)),
    voiceCostCents: voiceCost,
    sms: {
      outgoing: smsOutgoing,
      incoming: smsIncoming
    },
    generatedAt: new Date().toISOString()
  });
});
