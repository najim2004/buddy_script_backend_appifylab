import { Type, TSchema, Static } from '@sinclair/typebox';

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

/**
 * OpenAPI-friendly string enum.
 * Type.Enum / Union+Literal emit `anyOf` + `const`, so Swagger UI often shows
 * only one option. This emits `{ type: 'string', enum: [...] }` instead.
 *
 * @example
 *   StringEnum(PostVisibility)
 *   StringEnum(['male', 'female'] as const)
 */
export function StringEnum<T extends string>(
  values: readonly T[] | Record<string, T>,
) {
  const enums = Array.isArray(values) ? [...values] : Object.values(values);
  return Type.Unsafe<T>({
    type: 'string',
    enum: enums,
  });
}

/**
 * Text field shape when `@fastify/multipart` is registered with
 * `attachFieldsToBody: true` (official Fastify pattern).
 *
 * @see https://github.com/fastify/fastify-multipart#json-schema-non-file-field
 */
export const MultipartText = <T extends TSchema>(schema: T) =>
  Type.Object({
    value: schema,
  });

/**
 * File field for Swagger + Ajv via `@fastify/multipart` `ajvFilePlugin`.
 * Emits OpenAPI `{ type: 'string', format: 'binary' }` and validates
 * `!!field.file` at runtime.
 *
 * @see https://github.com/fastify/fastify-multipart#json-schema-with-swagger
 */
export const MultipartFile = Type.Unsafe<{
  type: 'file';
  toBuffer: () => Promise<Buffer>;
  filename: string;
  mimetype: string;
  file: unknown;
}>({ isFile: true });

export type MultipartFileType = Static<typeof MultipartFile>;

/** Single file or repeated same-name file fields. */
export const MultipartFiles = Type.Union([
  MultipartFile,
  Type.Array(MultipartFile),
]);

export type MultipartFilesType = Static<typeof MultipartFiles>;
