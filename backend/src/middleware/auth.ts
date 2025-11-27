// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * Simple Bearer API key auth for admin/reporting APIs.
 *
 * Expects:
 *   Authorization: Bearer <ADMIN_API_KEY>
 *
 * - Skips OPTIONS to avoid breaking CORS preflight.
 * - Returns 401 on missing/invalid key.
 */
export function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Allow CORS preflight through without auth
  if (req.method === 'OPTIONS') {
    return next();
  }

  const header =
    req.header('authorization') || req.header('Authorization') || '';

  if (!header.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Missing or invalid Authorization header' });
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token || token !== env.ADMIN_API_KEY) {
    return res.status(401).json({ message: 'Invalid API key' });
  }

  return next();
}
