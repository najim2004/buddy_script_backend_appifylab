import { FastifyInstance } from 'fastify';
import { SWAGGER_TAGS } from '../../docs/swagger';
import { successResponse } from '../../core/utils/response';

/**
 * Chats module route skeleton.
 *
 * Real-time messaging is handled through Socket.io events.
 * This REST module handles conversation management (create, list, delete).
 *
 * TODO: Add chats controller, service, and repository following the
 *       same pattern as the users module.
 */
export const chatsRoute = async (fastify: FastifyInstance): Promise<void> => {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.CHATS],
        summary: 'List user conversations',
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      reply.send(successResponse([], 'Chats module — implementation pending'));
    },
  );
};

export default chatsRoute;
