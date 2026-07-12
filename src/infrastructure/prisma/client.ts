import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import env from '../../app/env';
import { PrismaClient } from '../../../prisma/generated/client';

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log:
    env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
});

export default prisma;
