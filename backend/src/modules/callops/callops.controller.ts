// src/modules/callops/callops.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient, CallStatus } from '@prisma/client';

const prisma = new PrismaClient();
export const callOpsRouter = express.Router();

callOpsRouter.get('/calls/live', async (_req: Request, res: Response) => {
  // ... (existing code)
});

callOpsRouter.get('/calls/callbacks', async (_req: Request, res: Response) => {
  // ... (existing code)
});

callOpsRouter.get('/calls/voicemails', async (_req: Request, res: Response) => {
  const voicemails = await prisma.voicemail.findMany({
    orderBy: { receivedAt: 'desc' },
    include: { 
      callSession: {
        select: { publicId: true, fromNumber: true }
      },
      assignedTo: {
        select: { id: true, name: true, avatarUrl: true }
      }
    }
  });

  res.json(
    voicemails.map((vm) => ({
      id: vm.id,
      status: vm.status,
      priority: vm.priority,
      recordingUrl: vm.recordingUrl,
      transcription: vm.transcription,
      assignedTo: vm.assignedTo,
      notes: vm.notes,
      callbackScheduledAt: vm.callbackScheduledAt?.toISOString() || null,
      receivedAt: vm.receivedAt.toISOString(),
      callerId: vm.callSession?.fromNumber,
    }))
  );
});

callOpsRouter.patch('/calls/voicemails/:id/assign', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { teamMemberId } = req.body;

        if (!teamMemberId) {
            return res.status(400).json({ message: 'teamMemberId is required.' });
        }

        const updatedVoicemail = await prisma.voicemail.update({
            where: { id },
            data: { assignedToId: teamMemberId, status: 'ACTIVE' },
            include: { assignedTo: true }
        });

        res.json(updatedVoicemail);
    } catch (error) {
        console.error(`Error assigning voicemail ${req.params.id}:`, error);
        res.status(500).json({ message: 'Failed to assign voicemail.' });
    }
});

callOpsRouter.post('/calls/voicemails/:id/schedule-callback', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { dueAt, notes } = req.body;

        const voicemail = await prisma.voicemail.findUnique({
            where: { id },
            include: { callSession: true }
        });

        if (!voicemail || !voicemail.callSession) {
            return res.status(404).json({ message: 'Voicemail or associated call session not found.' });
        }

        const newCallback = await prisma.callbackRequest.create({
            data: {
                callSessionId: voicemail.callSessionId,
                dueAt: dueAt ? new Date(dueAt) : new Date(Date.now() + 60 * 60 * 1000), // Default to 1 hour from now
                notes: notes || `Callback for voicemail from ${voicemail.callSession.fromNumber}`,
                priority: 2, // Mid-level priority
                status: 'OPEN',
                assignedTo: voicemail.assignedToId
            }
        });
        
        // Update voicemail status
        await prisma.voicemail.update({
            where: { id },
            data: { status: 'ARCHIVED', notes: `Callback scheduled: ${newCallback.id}` }
        });

        res.status(201).json(newCallback);
    } catch (error) {
        console.error(`Error scheduling callback for voicemail ${req.params.id}:`, error);
        res.status(500).json({ message: 'Failed to schedule callback.' });
    }
});
