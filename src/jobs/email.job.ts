import { emailQueue } from '../infrastructure/queues/email.queue';
import logger from '../app/logger';

/**
 * Registers BullMQ repeatable jobs for email-related scheduled tasks.
 *
 * Call this function once during server startup (e.g. from `server.ts`)
 * to ensure recurring email jobs are scheduled.
 *
 * Examples of scheduled email tasks:
 *  - Daily digest emails
 *  - Weekly report summaries
 *  - Expiry reminders (subscriptions, passwords, etc.)
 */
export const runEmailJob = async (): Promise<void> => {
  logger.info('📬 Registering email background jobs...');

  // Example: Daily digest — runs every day at 08:00 UTC
  await emailQueue.add(
    'daily-digest',
    {
      to: '__system__', // Marker — worker resolves actual recipients
      subject: 'Daily Digest',
      template: 'verify',
      context: { type: 'digest' },
    },
    {
      repeat: { pattern: '0 8 * * *' }, // cron: every day at 08:00
      jobId: 'daily-digest-repeatable', // Stable ID prevents duplicates on restart
    },
  );

  logger.info('✅ Email jobs registered successfully');
};

export default runEmailJob;
