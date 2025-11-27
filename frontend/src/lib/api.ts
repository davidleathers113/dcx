// frontend/src/lib/api.ts
import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';

const baseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const adminApiKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;
const defaultHeaders: Record<string, string> = {
  ...(adminApiKey ? { Authorization: `Bearer ${adminApiKey}` } : {})
};

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
    ...defaultHeaders
  }
});

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...defaultHeaders,
      ...(init.headers ?? {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed (${response.status}): ${text}`);
  }

  return (await response.json()) as T;
}

export async function apiMutate<T>(
  path: string,
  options: { method?: 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown } = {}
): Promise<T> {
  return apiFetch<T>(path, {
    method: options.method ?? 'POST',
    body: options.body ? JSON.stringify(options.body) : undefined
  });
}
