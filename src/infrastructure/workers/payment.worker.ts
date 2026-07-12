import { Worker, Job } from 'bullmq';
import { redisConnectionOptions } from '../redis/redis';
import { QUEUE_NAMES } from '../../core/constants';
import logger from '../../app/logger';

// ---------------------------------------------------------------------------
// Job data interface
// ---------------------------------------------------------------------------

export interface PaymentJobData {
  userId: string;
  amount: number;
  currency: string;
  transactionId: string;
  provider: 'stripe' | 'paypal';
  metadata?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

/**
 * Processes jobs from the payment queue.
 *
 * Handles post-payment tasks such as:
 *   - Updating the `PaymentTransaction` record status in the database
 *   - Triggering email receipts
 *   - Notifying downstream services
 *
 * The actual charge is initiated via the payments API endpoint;
 * this worker handles async follow-up processing.
 */
export const paymentWorker = new Worker<PaymentJobData>(
  QUEUE_NAMES.PAYMENT,
  async (job: Job<PaymentJobData>) => {
    const { userId, amount, currency, transactionId, provider } = job.data;

    logger.info(
      { jobId: job.id, userId, transactionId, provider },
      '💳 Processing payment job',
    );

    // TODO: Implement payment post-processing logic here, e.g.:
    //   await prisma.paymentTransaction.update({ where: { id: transactionId }, data: { status: 'completed' } });
    //   await emailQueue.add('sendPaymentReceipt', { userId, amount, currency });

    logger.info(
      { jobId: job.id, transactionId, amount: `${amount} ${currency}` },
      '✅ Payment job processed',
    );
  },
  {
    connection: redisConnectionOptions,
    concurrency: 2, // Limit concurrent payment processing
  },
);

// ---------------------------------------------------------------------------
// Worker event handlers
// ---------------------------------------------------------------------------

paymentWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id }, '🟢 Payment job completed');
});

paymentWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, '🔴 Payment job failed');
});

paymentWorker.on('error', (err) => {
  logger.error({ err }, 'Payment worker encountered an error');
});

export default paymentWorker;
