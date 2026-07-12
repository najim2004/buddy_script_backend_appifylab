import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import {
  stripe,
  stripePaymentService,
  StripePaymentService,
} from '../infrastructure/payments/stripe';
import Stripe from 'stripe';
import env from '../app/env';
import logger from '../app/logger';

declare module 'fastify' {
  interface FastifyInstance {
    stripe: Stripe;
    stripePaymentService: StripePaymentService;
  }
}

const stripePlugin: FastifyPluginAsync = fp(async (fastify) => {
  if (!env.STRIPE_SECRET_KEY) {
    logger.warn(
      '⚠️  Stripe plugin loaded without STRIPE_SECRET_KEY. Payment features are disabled.',
    );
  }

  fastify.decorate('stripe', stripe);
  fastify.decorate('stripePaymentService', stripePaymentService);
});

export default stripePlugin;
