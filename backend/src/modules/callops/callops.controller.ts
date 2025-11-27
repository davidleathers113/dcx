// src/modules/callops/callops.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient, CallStatus } from '@prisma/client';

const prisma = new PrismaClient();
export const callOpsRouter = express.Router();

callOpsRouter.get('/calls/live', async (_req: Request, res: Response) => {
  const liveCalls = await prisma.callSession.findMany({
    where: { status: { in: [CallStatus.IN_PROGRESS, CallStatus.RINGING] } },
    orderBy: { createdAt: 'desc' },
    include: { campaign: true, buyer: true }
  });

  res.json(
    liveCalls.map((call) => ({
      id: call.id,
      status: call.status,
      from: call.fromNumber,
      to: call.toNumber,
      campaign: call.campaign?.name ?? 'N/A',
      buyer: call.buyer?.name ?? 'Routing',
      startedAt: call.createdAt.toISOString()
    }))
  );
});

callOpsRouter.get('/calls/callbacks', async (_req: Request, res: Response) => {
  const callbacks = await prisma.callbackRequest.findMany({
    orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    include: { callSession: true }
  });

  res.json(
    callbacks.map((cb) => ({
      id: cb.id,
      status: cb.status,
      priority: cb.priority,
      assignedTo: cb.assignedTo,
      notes: cb.notes,
      dueAt: cb.dueAt ? cb.dueAt.toISOString() : null,
      callId: cb.callSession?.publicId ?? cb.callSessionId
    }))
  );
});

callOpsRouter.get('/calls/voicemails', async (_req: Request, res: Response) => {
  const voicemails = await prisma.voicemail.findMany({
    orderBy: { receivedAt: 'desc' },
    include: { callSession: true }
  });

  res.json(
    voicemails.map((vm) => ({
      id: vm.id,
      status: vm.status,
      recordingUrl: vm.recordingUrl,
      transcription: vm.transcription,
      assignedTo: vm.assignedTo,
      receivedAt: vm.receivedAt.toISOString(),
      callId: vm.callSession?.publicId ?? vm.callSessionId
    }))
  );
});
