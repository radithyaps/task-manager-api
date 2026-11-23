'use strict';

const path = require('node:path');
const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

function integerSetting(min, max, fallback) {
  return z.coerce.number().int().min(min).max(max).default(fallback);
}

const databaseUrl = z.url({ protocol: /^postgres(ql)?$/ });

function isOrigin(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
  } catch {
    return false;
  }
}

const settings = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: integerSetting(1, 65535, 3000),
  DATABASE_URL: databaseUrl,
  DIRECT_URL: databaseUrl,
  JWT_SECRET: z.string().min(32),
  BCRYPT_SALT_ROUNDS: integerSetting(10, 14, 12),
  CORS_ORIGIN: z.string().default('http://localhost:5173')
    .transform((value) => value.split(',').map((origin) => origin.trim()))
    .pipe(z.array(z.string().refine(isOrigin)).min(1)),
  RATE_LIMIT_WINDOW_MS: integerSetting(1000, 86400000, 900000),
  RATE_LIMIT_MAX: integerSetting(1, 100000, 300),
  AUTH_RATE_LIMIT_MAX: integerSetting(1, 10000, 20),
  TRUST_PROXY_HOPS: integerSetting(0, 10, 0),
});

const result = settings.safeParse(process.env);
if (!result.success) {
  const keys = [...new Set(result.error.issues.map((issue) => issue.path[0]))];
  throw new Error(`Periksa konfigurasi .env: ${keys.join(', ')}. Lihat README.md.`);
}

const config = Object.freeze(result.data);
// Cache modul CommonJS membuat instance ini dipakai bersama oleh semua service.
const prisma = new PrismaClient({ errorFormat: 'minimal' });

module.exports = { config, prisma };
