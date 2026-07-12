import bcrypt from 'bcryptjs';
import prisma from '../../infrastructure/prisma/client';
import env from '../../app/env';
import logger from '../../app/logger';
import { USER_TYPES } from '../constants';

/**
 * Seed required system data on server startup.
 *
 * Uses `upsert` to be idempotent — safe to run on every startup.
 * Only creates/verifies the system admin account.
 */
export const seedDatabase = async (): Promise<void> => {
  logger.info('🌱 Running database seed check...');

  await seedSystemAdmin();

  logger.info('✅ Database seed completed.');
};

/**
 * Ensure the system admin user exists.
 * If the user already exists, no changes are made.
 */
const seedSystemAdmin = async (): Promise<void> => {
  const adminEmail = env.SYSTEM_EMAIL;

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    select: { id: true },
  });

  if (existingAdmin) {
    logger.info(`👤 System admin already exists (${adminEmail})`);
    return;
  }

  const hashedPassword = await bcrypt.hash(env.SYSTEM_PASSWORD, 12);

  await prisma.user.create({
    data: {
      email: adminEmail,
      name: env.SYSTEM_USERNAME,
      username: env.SYSTEM_USERNAME,
      password: hashedPassword,
      type: USER_TYPES.ADMIN,
    },
  });

  logger.info(`👤 System admin created (${adminEmail})`);
};
