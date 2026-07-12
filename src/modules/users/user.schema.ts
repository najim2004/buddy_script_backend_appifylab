import { Type, Static } from '@sinclair/typebox';
import { StringEnum } from '../../core/utils/schema';

export const Gender = {
  male: 'male',
  female: 'female',
  other: 'other',
  prefer_not_to_say: 'prefer_not_to_say',
} as const;

export const updateUserSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  first_name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  last_name: Type.Optional(Type.String({ minLength: 1, maxLength: 255 })),
  phone_number: Type.Optional(Type.String({ pattern: '^\\+?[1-9]\\d{6,14}$' })),
  gender: Type.Optional(StringEnum(Gender)),
});

export type UpdateUserDto = Static<typeof updateUserSchema>;
