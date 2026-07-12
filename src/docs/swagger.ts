/**
 * Shared Swagger / OpenAPI schema definitions.
 *
 * Import these into route schemas to avoid re-declaring common response
 * shapes in every route file.
 *
 * Usage in a route:
 *   fastify.get('/me', {
 *     schema: {
 *       tags: ['Auth'],
 *       security: [{ bearerAuth: [] }],
 *       response: {
 *         200: successSchema({ ... }),
 *         401: unauthorizedResponse,
 *       },
 *     },
 *   }, handler);
 */

// ---------------------------------------------------------------------------
// Generic response schema builders
// ---------------------------------------------------------------------------

/**
 * Wrap a data schema in the standard success response envelope.
 */
export const successSchema = (
  dataSchema: Record<string, unknown>,
  description = 'Successful response',
) => ({
  type: 'object',
  description,
  properties: {
    success: { type: 'boolean', example: true },
    data: dataSchema,
    message: { type: 'string' },
  },
  required: ['success', 'data'],
});

/**
 * Standard error response shape.
 */
export const errorSchema = (description = 'Error response') => ({
  type: 'object',
  description,
  properties: {
    success: { type: 'boolean', example: false },
    code: { type: 'string', example: 'NOT_FOUND' },
    message: { type: 'string', example: 'Resource not found' },
  },
  required: ['success', 'code', 'message'],
});

/**
 * Paginated list response schema builder.
 */
export const paginatedSchema = (
  itemSchema: Record<string, unknown>,
  description = 'Paginated response',
) => ({
  type: 'object',
  description,
  properties: {
    success: { type: 'boolean', example: true },
    data: {
      type: 'array',
      items: itemSchema,
    },
    meta: {
      type: 'object',
      properties: {
        page: { type: 'integer', example: 1 },
        limit: { type: 'integer', example: 20 },
        total: { type: 'integer', example: 100 },
        totalPages: { type: 'integer', example: 5 },
        hasNextPage: { type: 'boolean', example: true },
        hasPrevPage: { type: 'boolean', example: false },
      },
    },
  },
  required: ['success', 'data', 'meta'],
});

// ---------------------------------------------------------------------------
// Common pre-built response schemas
// ---------------------------------------------------------------------------

export const unauthorizedResponse = errorSchema(
  'Unauthorized — missing or invalid session',
);
export const forbiddenResponse = errorSchema(
  'Forbidden — insufficient permissions',
);
export const notFoundResponse = errorSchema('Resource not found');
export const validationErrorResponse = {
  type: 'object',
  description: 'Validation error',
  properties: {
    success: { type: 'boolean', example: false },
    code: { type: 'string', example: 'VALIDATION_ERROR' },
    message: { type: 'string', example: 'Validation failed' },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string', example: 'email' },
          message: { type: 'string', example: 'Invalid email address' },
        },
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Swagger tag definitions — used to group routes in the UI
// ---------------------------------------------------------------------------

export const SWAGGER_TAGS = {
  AUTH: 'Auth',
  USERS: 'Users',
  POSTS: 'Posts',
  CHATS: 'Chats',
  NOTIFICATIONS: 'Notifications',
  PAYMENTS: 'Payments',
  ADMIN: 'Admin',
  FILES: 'Files',
} as const;
