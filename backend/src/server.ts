// src/server.ts
import { env } from './config/env'; // <-- must be first import to validate env

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import createError from 'http-errors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { PrismaClient } from '@prisma/client';

import { telephonyRouter } from './modules/telephony/telephony.controller';
import { routingRouter } from './modules/routing/routing.controller';
import { adminRouter } from './modules/admin/admin.controller';
import { reportingRouter } from './modules/reporting/reporting.controller';
import { conversionRouter } from './modules/conversion/conversion.controller';
import { campaignsRouter } from './modules/campaigns/campaigns.controller';
import { suppliersRouter } from './modules/suppliers/suppliers.controller';
import { buyersRouter } from './modules/buyers/buyers.controller';
import { numbersRouter } from './modules/numbers/numbers.controller';
import { settingsRouter } from './modules/settings/settings.controller';
import { adminAuth } from './middleware/auth';
import { performanceRouter } from './modules/performance/performance.controller';
import { opsRouter } from './modules/ops/ops.controller';
import { billingRouter } from './modules/billing/billing.controller';
import { leadsRouter } from './modules/leads/leads.controller';
import { smsRouter } from './modules/sms/sms.controller';
import { callOpsRouter } from './modules/callops/callops.controller';
import { ringPoolsRouter } from './modules/ringpools/ringpools.controller';
import { schedulesRouter } from './modules/schedules/schedules.controller';
import { trafficRouter } from './modules/traffic/traffic.controller';

const app = express();
const prisma = new PrismaClient();

// Trust proxy if you're behind a load balancer (important for Twilio URL calculation)
app.set('trust proxy', true);

// Global middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// JSON body parsing for normal APIs
app.use(express.json());

// Health check (public)
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime_seconds: process.uptime()
  });
});

// Telephony webhooks (Twilio, public but signature-protected)
app.use('/twilio', telephonyRouter);

// Internal routing API (you may put this behind VPN / infra security)
app.use('/internal', routingRouter);

// ---- Protected Admin / Reporting / Conversion APIs ----

// All /api/* routes require valid ADMIN_API_KEY
app.use('/api', adminAuth);

// Admin API (configuration): /api/campaigns, /api/buyers, /api/offers
app.use('/api', adminRouter);

// Reporting API (runtime views): /api/calls, /api/numbers
app.use('/api', reportingRouter);

// Conversion API (offline events): /api/conversions
app.use('/api', conversionRouter);
// Admin API (campaigns): /api/campaigns
app.use('/api', campaignsRouter);
// Admin API (suppliers): /api/suppliers
app.use('/api', suppliersRouter);
// Admin API (buyers): /api/buyers
app.use('/api', buyersRouter);
// Admin API (numbers): /api/numbers
app.use('/api', numbersRouter);
// Admin API (settings): /api/settings
app.use('/api', settingsRouter);
// Observability / Ops
app.use('/api', performanceRouter);
app.use('/api', opsRouter);
app.use('/api', billingRouter);
app.use('/api', leadsRouter);
app.use('/api', smsRouter);
app.use('/api', callOpsRouter);
app.use('/api', ringPoolsRouter);
app.use('/api', schedulesRouter);
app.use('/api', trafficRouter);

// 404 handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createError(404, 'Not Found'));
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  const response: any = { message };
  if (env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(status).json(response);
});

// --- WebSocket Server Setup ---
const server = createServer(app);
const wss = new WebSocketServer({ server });

const liveMetricsClients = new Set<import('ws')>();
const liveCallsClients = new Set<import('ws')>();

wss.on('connection', (ws, req) => {
  const url = req.url;
  console.log(`Client connected to ${url}`);

  if (url === '/ws/live-metrics') {
    liveMetricsClients.add(ws);
    getLiveCallCount().then(count => {
      ws.send(JSON.stringify({ type: 'live-call-count', count }));
    });
    ws.on('close', () => {
      console.log('Live metrics client disconnected');
      liveMetricsClients.delete(ws);
    });
  } else if (url === '/ws/live-calls') {
    liveCallsClients.add(ws);
    getLiveCalls().then(calls => {
        ws.send(JSON.stringify({ type: 'live-calls', calls }));
    });
    ws.on('close', () => {
      console.log('Live calls client disconnected');
      liveCallsClients.delete(ws);
    });
  } else {
    ws.close(1011, 'Unsupported endpoint');
  }
});

async function getLiveCallCount() {
    return prisma.callSession.count({
        where: { status: { in: ['IN_PROGRESS', 'RINGING'] } },
    });
}

async function getLiveCalls() {
    return prisma.callSession.findMany({
        where: { status: { in: ['IN_PROGRESS', 'RINGING'] } },
        include: {
            buyer: { select: { id: true, name: true } },
            campaign: { select: { id: true, name: true, vertical: true } },
            trafficSource: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

// TODO: Replace polling with a Redis pub/sub model for better performance
setInterval(async () => {
  const count = await getLiveCallCount();
  const message = JSON.stringify({ type: 'live-call-count', count });
  liveMetricsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}, 2000);

setInterval(async () => {
  const calls = await getLiveCalls();
  const message = JSON.stringify({ type: 'live-calls', calls });
  liveCallsClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}, 2000);


// --- Start Server ---
const PORT = env.PORT;
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`DCX backend listening on port ${PORT} (${env.NODE_ENV})`);
});
