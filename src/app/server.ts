import { createApp } from './app';
import env from './env';
import logger from './logger';
import { seedDatabase } from '../core/utils/seed';

/**
 * Bootstrap and start the HTTP server.
 *
 * Responsibilities:
 *  1. Build the Fastify app (register plugins, routes, hooks)
 *  2. Run idempotent database seeding
 *  3. Listen on the configured host/port
 *  4. Register SIGTERM/SIGINT handlers for graceful shutdown
 */
export const startServer = async (): Promise<void> => {
  const app = await createApp();

  // Run database seeding (idempotent — safe on every startup)
  await seedDatabase();

  const port = env.PORT;
  const host = '0.0.0.0';

  await app.listen({ port, host });

  logger.info(`🚀 Server listening on ${env.APP_URL}`);
  logger.info(`📝 Swagger docs: ${env.APP_URL}/api/docs`);

  // ---------------------------------------------------------------------------
  // Graceful Shutdown
  // Fastify's `close()` triggers the `onClose` hooks which cleanly disconnect
  // Prisma, Redis, and Socket.io before the process exits.
  // ---------------------------------------------------------------------------

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    try {
      await app.close();
      logger.info('Server shut down gracefully. Goodbye! 👋');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled promise rejections to prevent silent failures
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    process.exit(1);
  });
};

export default startServer;
