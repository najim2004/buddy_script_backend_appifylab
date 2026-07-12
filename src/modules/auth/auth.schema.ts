import { Type, Static } from '@sinclair/typebox';

export const signUpSchema = Type.Object({
  first_name: Type.String({ minLength: 1 }),
  last_name: Type.String({ minLength: 1 }),
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 8 }),
});

export const signInSchema = Type.Object({
  email: Type.String({ format: 'email' }),
  password: Type.String({ minLength: 1 }),
});

export type SignUpDto = Static<typeof signUpSchema>;
export type SignInDto = Static<typeof signInSchema>;

/**
 * Profile update schema — used by the users module for PATCH /api/users/me.
 * Kept here and re-exported so the users module can import from a shared location.
 */
export const updateProfileSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  first_name: Type.Optional(Type.String({ minLength: 1 })),
  last_name: Type.Optional(Type.String({ minLength: 1 })),
  phone_number: Type.Optional(Type.String()),
  avatar: Type.Optional(Type.String({ format: 'uri' })),
});

export type UpdateProfileDto = Static<typeof updateProfileSchema>;
