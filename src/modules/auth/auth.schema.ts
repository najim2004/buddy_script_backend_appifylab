import { z } from 'zod';

/**
 * Profile update schema — used by the users module for PATCH /api/users/me.
 * Kept here and re-exported so the users module can import from a shared location.
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  phone_number: z.string().optional(),
  avatar: z.string().url().optional(),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
