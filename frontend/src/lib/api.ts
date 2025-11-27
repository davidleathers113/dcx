// frontend/src/lib/api.ts
import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const adminApiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

/**
 * Typed API client for the DCX backend.
 *
 * Adds:
 *   Authorization: Bearer <NEXT_PUBLIC_ADMIN_API_KEY>
 * to all requests, so protected /api routes succeed.
 */
export const apiClient = createClient<paths>({
  baseUrl,
  headers: {
    ...(adminApiKey
      ? { Authorization: `Bearer ${adminApiKey}` }
      : {})
  }
});
