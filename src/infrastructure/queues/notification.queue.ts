import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../redis/redis';
import { QUEUE_NAMES } from '../../core/constants';

/**
 * BullMQ queue for in-app notifications.
 *
 * Add jobs via `notificationQueue.add(jobName, data)`.
 * Processed by future `src/infrastructure/workers/notification.worker.ts`.
 */
export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export default notificationQueue;
