import path from 'path';
import fastify, { FastifyInstance, FastifyBaseLogger } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart, { ajvFilePlugin } from '@fastify/multipart';
import sensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';

import prismaPlugin from '../plugins/prisma.plugin';
import redisPlugin from '../plugins/redis.plugin';
import authPlugin from '../plugins/auth.plugin';
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
    // Required for @fastify/multipart + @fastify/swagger file fields (`isFile`)
    ajv: {
      plugins: [
        (ajv) => {
          ajvFilePlugin(ajv);
          return ajv;
        },
      ],
    },
  }) as unknown as FastifyInstance;

  // ---------------------------------------------------------------------------
  // Global Error Handler
  // ---------------------------------------------------------------------------
  app.setErrorHandler(errorMiddleware);

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

  // Official Fastify multipart + Swagger pattern:
  // attachFieldsToBody + ajvFilePlugin + schema `{ isFile: true }`
  await app.register(multipart, {
    attachFieldsToBody: true,
    limits: {
      fileSize: 20 * 1024 * 1024,
      files: 10,
    },
  });

  // Serve local storage files at /public/storage/...
  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), 'public'),
    prefix: '/public/',
    decorateReply: false,
  });

  // ---------------------------------------------------------------------------
  // Infrastructure Plugins (decorate `fastify.prisma`, `fastify.redis`, etc.)
  // ---------------------------------------------------------------------------

  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(authPlugin);
  await app.register(swaggerPlugin);
  await app.register(socketPlugin);
  await app.register(stripePlugin);

  // ---------------------------------------------------------------------------
  // Routes
  // ---------------------------------------------------------------------------

  await registerRoutes(app);

  return app;
};

export default createApp;
