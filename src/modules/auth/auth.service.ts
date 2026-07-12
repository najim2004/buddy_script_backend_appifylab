import prisma from '../../infrastructure/prisma/client';
import { NotFoundError } from '../../core/errors/app.error';
import { AuthMeResponse } from './auth.types';
export class AuthService {
  async me(userId: string): Promise<AuthMeResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        type: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}

export const authService = new AuthService();
export default authService;
