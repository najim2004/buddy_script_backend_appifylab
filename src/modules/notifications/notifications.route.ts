import { FastifyInstance } from 'fastify';
import { SWAGGER_TAGS } from '../../docs/swagger';
import { successResponse } from '../../core/utils/response';

/**
 * Notifications module route skeleton.
 *
 * TODO: Add notifications controller, service, and repository following the
 *       same pattern as the users module.
 */
export const notificationsRoute = async (
  fastify: FastifyInstance,
): Promise<void> => {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.NOTIFICATIONS],
        summary: 'List user notifications',
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      reply.send(
        successResponse([], 'Notifications module — implementation pending'),
      );
    },
  );
};

export default notificationsRoute;
