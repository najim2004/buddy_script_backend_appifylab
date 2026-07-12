import { FastifyInstance } from 'fastify';
import { SWAGGER_TAGS } from '../../docs/swagger';
import { successResponse } from '../../core/utils/response';

/**
 * Admin module route skeleton.
 *
 * All admin routes should require authentication AND the 'admin' role.
 * Use `permissionHook('admin')` from hooks/permission.hook.ts.
 *
 * Example:
 *   fastify.get('/', {
 *     preHandler: [fastify.authenticate, permissionHook('admin')],
 *   }, handler);
 */
export const adminRoute = async (fastify: FastifyInstance): Promise<void> => {
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        hide: true,
        tags: [SWAGGER_TAGS.ADMIN],
        summary: 'Admin dashboard — health check',
        security: [{ bearerAuth: [] }],
      },
    },
    async (_request, reply) => {
      reply.send(
        successResponse(
          { status: 'operational' },
          'Admin module — implementation pending',
        ),
      );
    },
  );
};

export default adminRoute;
