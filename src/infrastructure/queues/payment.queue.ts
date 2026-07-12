import { Queue } from 'bullmq';
import { redisConnectionOptions } from '../redis/redis';
import { QUEUE_NAMES } from '../../core/constants';

/**
 * BullMQ queue for payment processing jobs.
 *
 * Add jobs via `paymentQueue.add(jobName, data)`.
 * Processed by `src/infrastructure/workers/payment.worker.ts`.
 */
export const paymentQueue = new Queue(QUEUE_NAMES.PAYMENT, {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 5, // Payment jobs get more retries
    backoff: {
      type: 'exponential',
      delay: 10000,
    },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
});

export default paymentQueue;
