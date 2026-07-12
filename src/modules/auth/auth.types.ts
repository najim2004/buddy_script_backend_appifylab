import { User } from '../../../prisma/generated/client';

export interface AuthUserPayload {
  userId: string;
  email: string;
  type: string;
}

export type AuthMeResponse = Pick<
  User,
  'id' | 'email' | 'type' | 'first_name' | 'last_name' | 'created_at'
>;
