import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ override: true });

const envSchema = z.object({
  PORT: z.string().default('3001').transform(val => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url('Invalid DATABASE_URL format'),
  // No default for either of these - a secret with a working fallback isn't
  // a secret (anyone reading this public repo would know it), and an API
  // wide open to any origin isn't actually restricted. Missing either one
  // must fail startup loudly, not silently run insecure.
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN must be set to the real frontend origin(s), not left unset')
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
