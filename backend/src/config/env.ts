// src/config/env.ts
import 'dotenv/config';

type NodeEnv = 'development' | 'test' | 'production';

interface EnvConfig {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  TWILIO_AUTH_TOKEN: string;
  ADMIN_API_KEY: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Environment variable ${name} is required but not set.`);
  }
  return value.trim();
}

function parsePort(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Invalid PORT value: ${raw}`);
  }
  return n;
}

const NODE_ENV_RAW = process.env.NODE_ENV || 'development';
const NODE_ENV: NodeEnv =
  NODE_ENV_RAW === 'production' ||
  NODE_ENV_RAW === 'test' ||
  NODE_ENV_RAW === 'development'
    ? NODE_ENV_RAW
    : 'development';

// Validate critical env vars
const DATABASE_URL = requireEnv('DATABASE_URL');
const TWILIO_AUTH_TOKEN = requireEnv('TWILIO_AUTH_TOKEN');
const ADMIN_API_KEY = requireEnv('ADMIN_API_KEY');
const PORT = parsePort(process.env.PORT, 4000);

export const env: EnvConfig = {
  NODE_ENV,
  PORT,
  DATABASE_URL,
  TWILIO_AUTH_TOKEN,
  ADMIN_API_KEY
};
