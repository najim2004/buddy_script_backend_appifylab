import { Worker, Job } from 'bullmq';
import path from 'path';
import ejs from 'ejs';
import transporter from '../mail/transporter';
import { redisConnectionOptions } from '../redis/redis';
import { QUEUE_NAMES } from '../../core/constants';
import env from '../../app/env';
import logger from '../../app/logger';

// ---------------------------------------------------------------------------
// Job data interface
// ---------------------------------------------------------------------------

export interface EmailJobData {
  to: string;
  from?: string;
  subject: string;
  template: string;
  context: Record<string, string | number | boolean>;
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

/**
 * Processes jobs from the email queue.
 *
 * Each job renders an EJS template and delivers it via nodemailer.
 * Failed jobs are retried automatically by BullMQ (see queue defaultJobOptions).
 */
export const emailWorker = new Worker<EmailJobData>(
  QUEUE_NAMES.EMAIL,
  async (job: Job<EmailJobData>) => {
    const { to, subject, template, context } = job.data;

    logger.info({ jobId: job.id, to, template }, '✉️  Processing email job');

    // Resolve template path relative to the project root so it works
    // in both `ts-node` (src/) and compiled (dist/) contexts.
    const templatePath = path.resolve(
      process.cwd(),
      'src/infrastructure/mail/templates',
      `${template || 'verify'}.ejs`,
    );

    const html = await ejs.renderFile(templatePath, context || {});

    await transporter.sendMail({
      from: job.data.from ?? `${env.APP_NAME} <${env.MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    });

    logger.info({ jobId: job.id, to }, '✅ Email delivered successfully');
  },
  {
    connection: redisConnectionOptions,
    concurrency: 5, // Process up to 5 emails simultaneously
  },
);

// ---------------------------------------------------------------------------
// Worker event handlers
// ---------------------------------------------------------------------------

emailWorker.on('completed', (job) => {
  logger.debug({ jobId: job.id }, '🟢 Email job completed');
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, '🔴 Email job failed');
});

emailWorker.on('error', (err) => {
  logger.error({ err }, 'Email worker encountered an error');
});

export default emailWorker;
