import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { twoFactor } from 'better-auth/plugins';
import prisma from '../prisma/client';
import env from '../../app/env';

/**
 * Better Auth instance — the single source of truth for all authentication.
 *
 * Field mappings translate Better Auth's camelCase defaults to the
 * snake_case column names used in our PostgreSQL schema.
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,

  emailAndPassword: {
    enabled: true,
  },

  user: {
    modelName: 'User',
    fields: {
      image: 'avatar',
      emailVerified: 'email_verified',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },

  session: {
    modelName: 'Session',
    fields: {
      userId: 'user_id',
      expiresAt: 'expires_at',
      ipAddress: 'ip_address',
      userAgent: 'user_agent',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },

  account: {
    modelName: 'Account',
    fields: {
      userId: 'user_id',
      accountId: 'provider_account_id',
      providerId: 'provider',
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
      idToken: 'id_token',
      accessTokenExpiresAt: 'expires_at',
      refreshTokenExpiresAt: 'refresh_token_expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },

  verification: {
    modelName: 'Verification',
    fields: {
      expiresAt: 'expires_at',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },

  plugins: [
    twoFactor({
      otpLength: 6,
      period: 30,
      issuer: env.APP_NAME || 'FastifyTS',
      modelName: {
        twoFactor: 'TwoFactor',
      },
      fields: {
        user: {
          twoFactorEnabled: 'two_factor_enabled',
        },
        twoFactor: {
          secret: 'secret',
          backupCodes: 'backup_codes',
          userId: 'user_id',
        },
      },
    }),
  ],
});

export default auth;
