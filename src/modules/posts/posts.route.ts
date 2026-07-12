import { FastifyInstance } from 'fastify';
import { SWAGGER_TAGS } from '../../docs/swagger';
import { successResponse } from '../../core/utils/response';

/**
 * Posts module route skeleton.
 *
 * TODO: Add post controller, service, and repository following the
 *       same pattern as the users module.
 */
export const postsRoute = async (fastify: FastifyInstance): Promise<void> => {
  fastify.get(
    '/',
    {
      schema: {
        tags: [SWAGGER_TAGS.POSTS],
        summary: 'List all posts',
      },
    },
    async (_request, reply) => {
      reply.send(successResponse([], 'Posts module — implementation pending'));
    },
  );
};

export default postsRoute;
