import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../redis/redis';
import { QUEUE_NAMES } from '../../core/constants';

/**
 * BullMQ queue for outbound email delivery.
 *
 * Add jobs via `emailQueue.add(jobName, data)`.
 * Processed by `src/infrastructure/workers/email.worker.ts`.
 */
export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export default emailQueue;
