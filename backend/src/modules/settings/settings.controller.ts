// src/modules/settings/settings.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { env } from '../../config/env';

const prisma = new PrismaClient();
const settingsRouter = express.Router();

/**
 * Helper: Mask sensitive tokens/secrets for display
 * Shows first 4 and last 4 characters, masks the middle
 */
function maskSecret(value: string | undefined | null): string {
  if (!value || value.length < 8) {
    return '********************************';
  }
  const start = value.slice(0, 4);
  const end = value.slice(-4);
  const masked = '*'.repeat(Math.min(value.length - 8, 32));
  return `${start}${masked}${end}`;
}

/**
 * GET /api/settings
 * Fetch application settings from environment variables and database.
 * Fully integrated endpoint with real configuration sources.
 *
 * Note: Sensitive values (auth tokens, API keys) are masked for security.
 */
settingsRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    // Fetch security preferences from database (if available)
    const securityPreference = await prisma.securityPreference.findFirst();

    // Load Twilio configuration from environment
    const twilioSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || null;
    const twilioAuthToken = env.TWILIO_AUTH_TOKEN;

    // Load webhook configuration
    const outboundWebhookUrl = process.env.OUTBOUND_WEBHOOK_URL || null;

    // Build response with real config and masked secrets
    const response = {
      twilio_sid: twilioSid || 'Not configured',
      twilio_auth_token_masked: maskSecret(twilioAuthToken),
      outbound_webhook_url: outboundWebhookUrl || 'Not configured',

      // Include security preferences if available
      security: securityPreference ? {
        mfa_required: securityPreference.mfaRequired,
        api_key_rotation_days: securityPreference.apiKeyRotationDays,
        default_recording_enabled: securityPreference.defaultRecordingEnabled,
        cdr_retention_days: securityPreference.cdrRetentionDays
      } : null,

      // System info
      environment: env.NODE_ENV,
      api_version: '1.0.0'
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      message: 'Failed to fetch settings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export { settingsRouter };
