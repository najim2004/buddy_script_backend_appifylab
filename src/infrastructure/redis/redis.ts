import Redis from 'ioredis';
import type { RedisOptions } from 'ioredis';
import env from '../../app/env';
import logger from '../../app/logger';

/**
 * Shared Redis connection options.
 *
 * Exported so BullMQ queues and workers can reference the same configuration
 * without duplicating host/port/password across every file.
 */
export const redisConnectionOptions: RedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD || undefined,
  // Reconnect on failure with exponential back-off (capped at 3 s)
  retryStrategy: (times) => Math.min(times * 100, 3000),
  maxRetriesPerRequest: null, // Required by BullMQ
};

/**
 * Singleton Redis client used by the application layer (caching, sessions).
 *
 * BullMQ queues and workers create their own connections internally via
 * `redisConnectionOptions` — do NOT share this instance with them.
 */
export const redis = new Redis(redisConnectionOptions);

redis.on('connect', () => {
  logger.info('📶 Redis connected successfully');
});

redis.on('ready', () => {
  logger.debug('Redis client ready');
});

redis.on('error', (err) => {
  logger.error({ err }, '❌ Redis connection error');
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

export default redis;
