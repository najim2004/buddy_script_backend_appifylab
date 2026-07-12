import prisma from '../../infrastructure/prisma/client';
import { NotFoundError } from '../../core/errors/app.error';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  type: string | null;
  avatar: string | null;
  phone_number: string | null;
  created_at: Date;
}

export class AuthService {
  /**
   * Fetches the authenticated user's profile from our database.
   *
   * Better Auth manages the session; this endpoint returns our custom
   * user fields (type, username, avatar, etc.) that Better Auth doesn't expose.
   */
  async me(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        type: true,
        avatar: true,
        phone_number: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      ...user,
      email: user.email ?? '',
    };
  }
}

export const authService = new AuthService();
export default authService;
