// src/server.ts
import { env } from './config/env'; // <-- must be first import to validate env

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import createError from 'http-errors';

import { telephonyRouter } from './modules/telephony/telephony.controller';
import { routingRouter } from './modules/routing/routing.controller';
import { adminRouter } from './modules/admin/admin.controller';
import { reportingRouter } from './modules/reporting/reporting.controller';
import { conversionRouter } from './modules/conversion/conversion.controller';
import { adminAuth } from './middleware/auth';

const app = express();

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

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`DCX backend listening on port ${PORT} (${env.NODE_ENV})`);
});
