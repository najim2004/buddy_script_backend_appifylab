import { z } from 'zod';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';

const envConfig = dotenv.config();
dotenvExpand.expand(envConfig);

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(4000),
  APP_NAME: z.string().default('fastify-boilerplate'),
  APP_KEY: z.string().default('secret'),
  APP_URL: z.string().default('http://localhost:4000'),
  CLIENT_APP_URL: z.string().default('http://localhost:3000'),
  SESSION_SECRET: z.string().default('secret'),
  JWT_SECRET: z.string().default('secret'),
  JWT_EXPIRY: z.coerce.number().default(86400000), // in ms or string
  BETTER_AUTH_SECRET: z
    .string()
    .default('better-auth-secret-key-1234567890abcdef'),
  BETTER_AUTH_URL: z.string().default('http://localhost:4000'),

  DATABASE_URL: z.string(),

  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  MAIL_HOST: z.string().default('smtp.gmail.com'),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_USERNAME: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM_ADDRESS: z.string().default('noreply@example.com'),
  MAIL_FROM_NAME: z.string().default('Fastify-App'),

  GOOGLE_APP_ID: z.string().optional(),
  GOOGLE_APP_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),

  // Storage
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),

  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_DEFAULT_REGION: z.string().optional(),
  AWS_BUCKET: z.string().optional(),
  AWS_URL: z.string().optional(),
  AWS_ENDPOINT: z.string().optional(),

  GCP_PROJECT_ID: z.string().optional(),
  GCP_KEY_FILE: z.string().optional(),
  GCP_API_ENDPOINT: z.string().optional(),
  GCP_BUCKET: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_SECRET: z.string().optional(),
  PAYPAL_API: z.string().optional(),

  SYSTEM_USERNAME: z.string().default('admin'),
  SYSTEM_EMAIL: z.string().default('admin@example.com'),
  SYSTEM_PASSWORD: z.string().default('12356'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export default env;
export type Env = z.infer<typeof envSchema>;
