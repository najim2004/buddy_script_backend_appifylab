import { Type, Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import * as dotenv from 'dotenv';
import * as dotenvExpand from 'dotenv-expand';

const envConfig = dotenv.config();
dotenvExpand.expand(envConfig);

const envSchema = Type.Object({
  NODE_ENV: Type.Union(
    [
      Type.Literal('development'),
      Type.Literal('production'),
      Type.Literal('test'),
    ],
    { default: 'development' },
  ),
  PORT: Type.Number({ default: 4000 }),
  APP_NAME: Type.String({ default: 'fastify-boilerplate' }),
  APP_KEY: Type.String({ default: 'secret' }),
  APP_URL: Type.String({ default: 'http://localhost:4000' }),
  CLIENT_APP_URL: Type.String({ default: 'http://localhost:3000' }),
  SESSION_SECRET: Type.String({ default: 'secret' }),
  JWT_SECRET: Type.String({ default: 'secret' }),
  JWT_EXPIRY: Type.Number({ default: 86400000 }),
  BETTER_AUTH_SECRET: Type.String({
    default: 'better-auth-secret-key-1234567890abcdef',
  }),
  BETTER_AUTH_URL: Type.String({ default: 'http://localhost:4000' }),

  DATABASE_URL: Type.String(),

  REDIS_HOST: Type.String({ default: '127.0.0.1' }),
  REDIS_PORT: Type.Number({ default: 6379 }),
  REDIS_PASSWORD: Type.Optional(Type.String()),

  MAIL_HOST: Type.String({ default: 'smtp.gmail.com' }),
  MAIL_PORT: Type.Number({ default: 587 }),
  MAIL_USERNAME: Type.Optional(Type.String()),
  MAIL_PASSWORD: Type.Optional(Type.String()),
  MAIL_FROM_ADDRESS: Type.String({ default: 'noreply@example.com' }),
  MAIL_FROM_NAME: Type.String({ default: 'Fastify-App' }),

  GOOGLE_APP_ID: Type.Optional(Type.String()),
  GOOGLE_APP_SECRET: Type.Optional(Type.String()),
  GOOGLE_CALLBACK_URL: Type.Optional(Type.String()),

  // Storage
  STORAGE_DRIVER: Type.Union([Type.Literal('local'), Type.Literal('s3')], {
    default: 'local',
  }),

  AWS_ACCESS_KEY_ID: Type.Optional(Type.String()),
  AWS_SECRET_ACCESS_KEY: Type.Optional(Type.String()),
  AWS_DEFAULT_REGION: Type.Optional(Type.String()),
  AWS_BUCKET: Type.Optional(Type.String()),
  AWS_URL: Type.Optional(Type.String()),
  AWS_ENDPOINT: Type.Optional(Type.String()),

  GCP_PROJECT_ID: Type.Optional(Type.String()),
  GCP_KEY_FILE: Type.Optional(Type.String()),
  GCP_API_ENDPOINT: Type.Optional(Type.String()),
  GCP_BUCKET: Type.Optional(Type.String()),

  STRIPE_SECRET_KEY: Type.Optional(Type.String()),
  STRIPE_WEBHOOK_SECRET: Type.Optional(Type.String()),

  PAYPAL_CLIENT_ID: Type.Optional(Type.String()),
  PAYPAL_SECRET: Type.Optional(Type.String()),
  PAYPAL_API: Type.Optional(Type.String()),

  SYSTEM_USERNAME: Type.String({ default: 'admin' }),
  SYSTEM_EMAIL: Type.String({ default: 'admin@example.com' }),
  SYSTEM_PASSWORD: Type.String({ default: '12356' }),
});

const rawEnv = { ...process.env };
Value.Default(envSchema, rawEnv);
Value.Convert(envSchema, rawEnv);

if (!Value.Check(envSchema, rawEnv)) {
  const errors = [];
  const iterator = Value.Errors(envSchema, rawEnv)[Symbol.iterator]();
  let next = iterator.next();
  while (!next.done) {
    errors.push(next.value);
    next = iterator.next();
  }
  console.error('❌ Invalid environment variables:', errors);
  process.exit(1);
}

export const env = rawEnv as Static<typeof envSchema>;
export default env;
export type Env = Static<typeof envSchema>;
