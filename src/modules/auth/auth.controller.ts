import { FastifyReply, FastifyRequest } from 'fastify';
import authService from './auth.service';
import { successResponse } from '../../core/utils/response';

export class AuthController {
  /**
   * GET /api/auth/me
   *
   * Returns the current user's profile from our database.
   * The session is already validated by the `authenticate` preHandler.
   */
  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = request.user;
    const user = await authService.me(userId);
    reply.send(successResponse(user, 'User profile retrieved'));
  }
}

export const authController = new AuthController();
export default authController;
