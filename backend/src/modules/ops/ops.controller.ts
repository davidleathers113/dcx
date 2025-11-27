// src/modules/ops/ops.controller.ts
import express, { Request, Response } from 'express';
import {
  PrismaClient,
  AlertStatus,
  AlertSeverity,
  LogSeverity,
  WebhookDirection
} from '@prisma/client';

const prisma = new PrismaClient();
export const opsRouter = express.Router();

type AlertDto = {
  id: string;
  title: string;
  description?: string | null;
  severity: AlertSeverity;
  status: AlertStatus;
  openedAt: string;
  slaMinutes?: number | null;
  ackedAt?: string | null;
  ackedBy?: string | null;
  resolvedAt?: string | null;
};

function mapAlert(alert: any): AlertDto {
  return {
    id: alert.id,
    title: alert.title,
    description: alert.description,
    severity: alert.severity,
    status: alert.status,
    openedAt: alert.openedAt.toISOString(),
    slaMinutes: alert.slaMinutes,
    ackedAt: alert.ackedAt ? alert.ackedAt.toISOString() : null,
    ackedBy: alert.ackedBy,
    resolvedAt: alert.resolvedAt ? alert.resolvedAt.toISOString() : null
  };
}

opsRouter.get('/alerts', async (_req: Request, res: Response) => {
  const alerts = await prisma.alert.findMany({ orderBy: { openedAt: 'desc' } });
  const active = alerts.filter((a) => a.status !== AlertStatus.RESOLVED);
  const resolved = alerts.filter((a) => a.status === AlertStatus.RESOLVED);

  res.json({
    stats: {
      open: active.length,
      critical: active.filter((a) => a.severity === AlertSeverity.CRITICAL).length,
      acknowledged: active.filter((a) => a.status === AlertStatus.ACKNOWLEDGED).length
    },
    active: active.map(mapAlert),
    resolved: resolved.map(mapAlert)
  });
});

opsRouter.patch('/alerts/:id/ack', async (req: Request, res: Response) => {
  const { id } = req.params;
  const actor = String(req.body.acked_by ?? 'system');

  try {
    const updated = await prisma.alert.update({
      where: { id },
      data: {
        status: AlertStatus.ACKNOWLEDGED,
        ackedAt: new Date(),
        ackedBy: actor
      }
    });
    res.json(mapAlert(updated));
  } catch (err) {
    res.status(404).json({ message: 'Alert not found' });
  }
});

opsRouter.get('/notices', async (_req: Request, res: Response) => {
  const notices = await prisma.notice.findMany({ orderBy: { effectiveAt: 'desc' } });
  res.json(
    notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      body: notice.body,
      category: notice.category,
      effectiveAt: notice.effectiveAt.toISOString(),
      expiresAt: notice.expiresAt ? notice.expiresAt.toISOString() : null,
      attachmentUrl: notice.attachmentUrl
    }))
  );
});

opsRouter.get('/system-logs', async (req: Request, res: Response) => {
  const severityParam = req.query.severity ? String(req.query.severity) : undefined;
  const severityFilter =
    severityParam && (Object.values(LogSeverity) as string[]).includes(severityParam)
      ? (severityParam as LogSeverity)
      : undefined;
  const where = severityFilter ? { severity: severityFilter } : undefined;
  const logs = await prisma.systemLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Number(req.query.limit ?? 50)
  });

  res.json(
    logs.map((log) => ({
      id: log.id,
      component: log.component,
      severity: log.severity,
      message: log.message,
      traceId: log.traceId,
      callSessionId: log.callSessionId,
      createdAt: log.createdAt.toISOString()
    }))
  );
});

opsRouter.get('/webhook-logs', async (req: Request, res: Response) => {
  const directionParam = req.query.direction ? String(req.query.direction) : undefined;
  const directionFilter =
    directionParam && (Object.values(WebhookDirection) as string[]).includes(directionParam)
      ? (directionParam as WebhookDirection)
      : undefined;
  const where = directionFilter ? { direction: directionFilter } : undefined;
  const logs = await prisma.webhookLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: Number(req.query.limit ?? 50)
  });

  res.json(
    logs.map((log) => ({
      id: log.id,
      direction: log.direction,
      event: log.event,
      url: log.url,
      statusCode: log.statusCode,
      latencyMs: log.latencyMs,
      traceId: log.traceId,
      createdAt: log.createdAt.toISOString()
    }))
  );
});

opsRouter.get('/platform-migrations', async (_req: Request, res: Response) => {
  const migrations = await prisma.platformMigration.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(
    migrations.map((mig) => ({
      id: mig.id,
      sourceSystem: mig.sourceSystem,
      targetSystem: mig.targetSystem,
      owner: mig.owner,
      phase: mig.phase,
      risk: mig.risk,
      cutoverDate: mig.cutoverDate.toISOString(),
      summary: mig.summary,
      dependencies: mig.dependencies
    }))
  );
});

opsRouter.post('/platform-migrations', async (req: Request, res: Response) => {
  const { source_system, target_system, owner, phase, risk, cutover_date, summary } = req.body ?? {};

  if (!source_system || !target_system || !owner || !phase || !risk || !cutover_date) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const created = await prisma.platformMigration.create({
    data: {
      sourceSystem: source_system,
      targetSystem: target_system,
      owner,
      phase,
      risk,
      cutoverDate: new Date(cutover_date),
      summary
    }
  });

  res.status(201).json(created);
});

opsRouter.get('/teams', async (_req: Request, res: Response) => {
  const [teams, members, alerts] = await Promise.all([
    prisma.team.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.teamMember.findMany(),
    prisma.alert.findMany({ where: { status: { in: [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED] } } })
  ]);

  res.json(
    teams.map((team) => ({
      id: team.id,
      name: team.name,
      purpose: team.purpose,
      pagerNumber: team.pagerNumber,
      onCallContact: team.onCallContact,
      members: members.filter((member) => member.teamId === team.id).map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        email: member.email,
        lastSeenAt: member.lastSeenAt ? member.lastSeenAt.toISOString() : null
      })),
      openAlerts: alerts.filter((alert) => alert.affectedResource === team.id).length
    }))
  );
});

opsRouter.get('/team-members', async (_req: Request, res: Response) => {
  const members = await prisma.teamMember.findMany({ orderBy: { name: 'asc' } });
  res.json(
    members.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      email: member.email,
      teamId: member.teamId,
      lastSeenAt: member.lastSeenAt ? member.lastSeenAt.toISOString() : null
    }))
  );
});

opsRouter.get('/secret-items', async (_req: Request, res: Response) => {
  const secrets = await prisma.secretItem.findMany({ orderBy: { rotationDueAt: 'asc' } });
  res.json(
    secrets.map((secret) => ({
      id: secret.id,
      label: secret.label,
      scope: secret.scope,
      owner: secret.owner,
      rotationDueAt: secret.rotationDueAt.toISOString(),
      maskedValue: secret.maskedValue,
      notes: secret.notes
    }))
  );
});

opsRouter.get('/settings/security', async (_req: Request, res: Response) => {
  const preference = await prisma.securityPreference.findFirst();
  const recentLogs = await prisma.systemLog.findMany({
    where: { component: 'security' },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  res.json({
    preference,
    recentEvents: recentLogs.map((log) => ({
      id: log.id,
      message: log.message,
      severity: log.severity,
      createdAt: log.createdAt.toISOString()
    }))
  });
});

opsRouter.get('/settings/preferences', async (_req: Request, res: Response) => {
  const preference = await prisma.securityPreference.findFirst();
  res.json({
    defaultRecordingEnabled: preference?.defaultRecordingEnabled ?? true,
    cdrRetentionDays: preference?.cdrRetentionDays ?? 365,
    defaultBuyerCap: preference?.defaultBuyerCap ?? 100
  });
});

opsRouter.patch('/settings/preferences', async (req: Request, res: Response) => {
  const payload = req.body ?? {};
  const data: Record<string, any> = {};

  if (payload.defaultRecordingEnabled !== undefined) {
    data.defaultRecordingEnabled = Boolean(payload.defaultRecordingEnabled);
  }
  if (payload.cdrRetentionDays !== undefined) {
    data.cdrRetentionDays = Number(payload.cdrRetentionDays);
  }
  if (payload.defaultBuyerCap !== undefined) {
    data.defaultBuyerCap = Number(payload.defaultBuyerCap);
  }

  const preference = await prisma.securityPreference.findFirst();
  if (!preference) {
    const created = await prisma.securityPreference.create({
      data: {
        mfaRequired: true,
        ipAllowList: [],
        webhookSigningSecret: null,
        lastAuditAt: null,
        apiKeyRotationDays: 90,
        defaultRecordingEnabled:
          data.defaultRecordingEnabled ?? payload.defaultRecordingEnabled ?? true,
        cdrRetentionDays: data.cdrRetentionDays ?? payload.cdrRetentionDays ?? 365,
        defaultBuyerCap: data.defaultBuyerCap ?? payload.defaultBuyerCap ?? 100
      }
    });
    return res.json(created);
  }

  const updated = await prisma.securityPreference.update({
    where: { id: preference.id },
    data
  });

  res.json(updated);
});

opsRouter.get('/providers', async (_req: Request, res: Response) => {
  const providers = await prisma.providerAccount.findMany({ orderBy: { label: 'asc' } });
  res.json(providers);
});

opsRouter.get('/integrations', async (_req: Request, res: Response) => {
  const integrations = await prisma.integrationConfig.findMany({ orderBy: { name: 'asc' } });
  res.json(integrations);
});

opsRouter.get('/integrations/api-keys', async (_req: Request, res: Response) => {
  const keys = await prisma.adminApiKey.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(
    keys.map((key) => ({
      id: key.id,
      label: key.label,
      tokenPreview: key.tokenPreview,
      scopes: key.scopes,
      lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
      status: key.status,
      expiresAt: key.expiresAt ? key.expiresAt.toISOString() : null
    }))
  );
});

opsRouter.get('/webhooks', async (_req: Request, res: Response) => {
  const [subs, logs] = await Promise.all([
    prisma.webhookSubscription.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.webhookLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  ]);

  const latencyByUrl = new Map<string, number>();
  const countsByUrl = new Map<string, number>();
  logs.forEach((log) => {
    latencyByUrl.set(log.url, (latencyByUrl.get(log.url) ?? 0) + log.latencyMs);
    countsByUrl.set(log.url, (countsByUrl.get(log.url) ?? 0) + 1);
  });

  res.json(
    subs.map((sub) => ({
      id: sub.id,
      event: sub.event,
      url: sub.url,
      status: sub.status,
      failureCount: sub.failureCount,
      lastDeliveredAt: sub.lastDeliveredAt ? sub.lastDeliveredAt.toISOString() : null,
      avgLatencyMs: countsByUrl.get(sub.url)
        ? Math.round((latencyByUrl.get(sub.url)! / countsByUrl.get(sub.url)!) * 100) / 100
        : null
    }))
  );
});

opsRouter.post('/webhooks/:id/test', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const updated = await prisma.webhookSubscription.update({
      where: { id },
      data: { lastDeliveredAt: new Date(), failureCount: 0 }
    });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ message: 'Webhook not found' });
  }
});
