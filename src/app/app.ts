import fastify, { FastifyInstance, FastifyBaseLogger } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import sensible from '@fastify/sensible';

import prismaPlugin from '../plugins/prisma.plugin';
import redisPlugin from '../plugins/redis.plugin';
import jwtPlugin from '../plugins/jwt.plugin';
import swaggerPlugin from '../plugins/swagger.plugin';
import socketPlugin from '../plugins/socket.plugin';
import stripePlugin from '../plugins/stripe.plugin';

import registerRoutes from './register';
import errorMiddleware from '../middlewares/error.middleware';
import logger from './logger';
import env from './env';

export const createApp = async (): Promise<FastifyInstance> => {
  const app = fastify({
    // Use the application-level pino logger (includes redaction + formatting)
    loggerInstance: logger as unknown as FastifyBaseLogger,
    // Attach a unique request ID to every log line for traceability
    genReqId: () => crypto.randomUUID(),
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    trustProxy: env.NODE_ENV === 'production',
  }) as unknown as FastifyInstance;

  // ---------------------------------------------------------------------------
  // Security & Utility Plugins
  // ---------------------------------------------------------------------------

  await app.register(helmet, {
    // Disabled to allow Swagger UI to render inline scripts/styles
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: env.CLIENT_APP_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    // Return standard rate-limit headers
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
  });

  // Provides `reply.notFound()`, `reply.badRequest()`, etc.
  await app.register(sensible);

  // Automatically parse multipart/form-data bodies
  await app.register(multipart, { attachFieldsToBody: true });

  // ---------------------------------------------------------------------------
  // Infrastructure Plugins (decorate `fastify.prisma`, `fastify.redis`, etc.)
  // ---------------------------------------------------------------------------

  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(jwtPlugin);
  await app.register(swaggerPlugin);
  await app.register(socketPlugin);
  await app.register(stripePlugin);

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------

  await registerRoutes(app);

  // ---------------------------------------------------------------------------
  // Global Error Handler
  // ---------------------------------------------------------------------------

  app.setErrorHandler(errorMiddleware);

  return app;
};

export default createApp;
