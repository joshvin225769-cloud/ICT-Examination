import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)) });

export function getConfig() {
  const { MONGODB_URI, JWT_SECRET } = process.env;
  if (!MONGODB_URI) throw new Error('MONGODB_URI is required. Configure server/.env.');
  if (!JWT_SECRET || JWT_SECRET.length < 32) throw new Error('JWT_SECRET must contain at least 32 characters.');
  const origin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const parsed = new URL(origin);
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== origin) {
    throw new Error('CLIENT_ORIGIN must be a valid HTTP(S) origin without a trailing slash.');
  }
  const production = process.env.NODE_ENV === 'production';
  if (production && parsed.protocol !== 'https:') throw new Error('Production CLIENT_ORIGIN must use HTTPS.');
  return {
    mongoUri: MONGODB_URI,
    jwtSecret: JWT_SECRET,
    origin,
    production,
    port: Number(process.env.PORT || 5000),
    trustProxy: Number(process.env.TRUST_PROXY || 0)
  };
}
