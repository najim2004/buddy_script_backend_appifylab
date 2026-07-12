import { Type, TSchema } from '@sinclair/typebox';

/**
 * A reusable helper to create a standardized success response schema for Swagger.
 * Wraps the given data schema in the standard API success format.
 */
export const createSuccessResponseSchema = <T extends TSchema>(dataSchema: T) =>
  Type.Object({
    success: Type.Literal(true),
    message: Type.Optional(Type.String()),
    data: dataSchema,
  });
