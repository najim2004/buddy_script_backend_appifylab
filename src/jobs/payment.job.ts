import { paymentQueue } from '../infrastructure/queues/payment.queue';
import logger from '../app/logger';

/**
 * Registers BullMQ repeatable jobs for payment-related scheduled tasks.
 *
 * Call this function once during server startup (e.g. from `server.ts`)
 * to ensure recurring payment jobs are scheduled.
 *
 * Examples of scheduled payment tasks:
 *  - Subscription renewal checks
 *  - Failed payment retry attempts
 *  - Payout processing (marketplace scenarios)
 */
export const runPaymentJob = async (): Promise<void> => {
  logger.info('💳 Registering payment background jobs...');

  // Example: Subscription renewal check — runs every hour
  await paymentQueue.add(
    'subscription-renewal-check',
    {
      userId: '__system__', // Marker — worker resolves actual users
      amount: 0,
      currency: 'usd',
      transactionId: '__system__',
      provider: 'stripe',
      metadata: { type: 'renewal-check' },
    },
    {
      repeat: { pattern: '0 * * * *' }, // cron: every hour at :00
      jobId: 'subscription-renewal-repeatable', // Stable ID prevents duplicates
    },
  );

  logger.info('✅ Payment jobs registered successfully');
};

export default runPaymentJob;
