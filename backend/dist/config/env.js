"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
// src/config/env.ts
require("dotenv/config");
function requireEnv(name) {
    const value = process.env[name];
    if (!value || value.trim() === '') {
        throw new Error(`Environment variable ${name} is required but not set.`);
    }
    return value.trim();
}
function parsePort(raw, fallback) {
    if (!raw)
        return fallback;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
        throw new Error(`Invalid PORT value: ${raw}`);
    }
    return n;
}
const NODE_ENV_RAW = process.env.NODE_ENV || 'development';
const NODE_ENV = NODE_ENV_RAW === 'production' ||
    NODE_ENV_RAW === 'test' ||
    NODE_ENV_RAW === 'development'
    ? NODE_ENV_RAW
    : 'development';
// Validate critical env vars
const DATABASE_URL = requireEnv('DATABASE_URL');
const TWILIO_AUTH_TOKEN = requireEnv('TWILIO_AUTH_TOKEN');
const PORT = parsePort(process.env.PORT, 4000);
exports.env = {
    NODE_ENV,
    PORT,
    DATABASE_URL,
    TWILIO_AUTH_TOKEN
};
//# sourceMappingURL=env.js.map