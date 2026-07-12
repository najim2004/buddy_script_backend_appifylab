import { Type, Static } from '@sinclair/typebox';

export const updateUserSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  first_name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  last_name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  phone_number: Type.Optional(Type.String({ pattern: '^\\+?[1-9]\\d{6,14}$' })),
  gender: Type.Optional(
    Type.Union([
      Type.Literal('male'),
      Type.Literal('female'),
      Type.Literal('other'),
      Type.Literal('prefer_not_to_say'),
    ]),
  ),
});

export type UpdateUserDto = Static<typeof updateUserSchema>;
