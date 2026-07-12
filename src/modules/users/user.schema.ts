import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(1, 'Name cannot be empty').max(255).optional(),
  first_name: z.string().min(1).max(255).optional(),
  last_name: z.string().min(1).max(255).optional(),
  phone_number: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format')
    .optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
