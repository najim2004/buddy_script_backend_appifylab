import { FastifyInstance } from 'fastify';
import userController from './user.controller';
import { SWAGGER_TAGS } from '../../docs/swagger';

export const userRoute = async (fastify: FastifyInstance): Promise<void> => {
  /**
   * GET /api/users
   * Returns the authenticated user's profile.
   */
  fastify.get(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.USERS],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
      },
    },
    userController.getUser.bind(userController),
  );

  /**
   * PATCH /api/users
   * Updates the authenticated user's profile.
   */
  fastify.patch(
    '/',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.USERS],
        summary: 'Update current user profile',
        security: [{ bearerAuth: [] }],
      },
    },
    userController.updateUser.bind(userController),
  );
};

export default userRoute;
