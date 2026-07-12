import { FastifyReply, FastifyRequest } from 'fastify';
import userService from './user.service';
import { successResponse } from '../../core/utils/response';
import { NotFoundError } from '../../core/errors/app.error';
import type { UpdateUserDto } from './user.schema';

export class UserController {
  /**
   * GET /api/users
   * Returns the authenticated user's profile.
   */
  async getUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = request.user;
    const user = await userService.getUser(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    reply.send(successResponse(user));
  }

  /**
   * PATCH /api/users
   * Updates the authenticated user's profile.
   */
  async updateUser(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { userId } = request.user;
    const updatedUser = await userService.updateUser(
      userId,
      request.body as UpdateUserDto,
    );
    reply.send(successResponse(updatedUser, 'Profile updated successfully'));
  }
}

export const userController = new UserController();
export default userController;
