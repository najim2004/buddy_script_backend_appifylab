import { FastifyInstance } from 'fastify';
import { SWAGGER_TAGS } from '../../docs/swagger';
import { successResponse } from '../../core/utils/response';

/**
 * Payments module route skeleton.
 *
 * TODO: Add payment controller, service, and repository following the
 *       same pattern as the users module. Use `fastify.stripePaymentService`
 *       (registered by stripe.plugin) for Stripe operations.
 */
export const paymentsRoute = async (
  fastify: FastifyInstance,
): Promise<void> => {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.PAYMENTS],
        summary: 'List payment transactions',
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      reply.send(
        successResponse([], 'Payments module — implementation pending'),
      );
    },
  );
};

export default paymentsRoute;
