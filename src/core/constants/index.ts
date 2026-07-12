/**
 * Application-wide constants.
 *
 * Centralizing these values avoids magic strings/numbers scattered across
 * the codebase and makes them easy to update from a single location.
 */

// ---------------------------------------------------------------------------
// HTTP Status Codes (subset — use for explicit status code references)
// ---------------------------------------------------------------------------

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ---------------------------------------------------------------------------
// User Types
// ---------------------------------------------------------------------------

export const USER_TYPES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator',
} as const;

export type UserType = (typeof USER_TYPES)[keyof typeof USER_TYPES];

// ---------------------------------------------------------------------------
// BullMQ Queue Names — single source of truth
// ---------------------------------------------------------------------------

export const QUEUE_NAMES = {
  EMAIL: 'mail-queue',
  PAYMENT: 'payment-queue',
  NOTIFICATION: 'notification-queue',
} as const;

// ---------------------------------------------------------------------------
// Cache TTL values (in seconds)
// ---------------------------------------------------------------------------

export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const;

// ---------------------------------------------------------------------------
// Pagination defaults
// ---------------------------------------------------------------------------

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// ---------------------------------------------------------------------------
// Storage Directories / Paths
// Centralizing folder names to avoid magic strings across services.
// ---------------------------------------------------------------------------

export const STORAGE_PATHS = {
  ROOT: 'public/storage',
  AVATAR: 'avatars',
  BLOG: 'blog',
  ATTACHMENT: 'attachments',
  POST: 'posts',
  DOCUMENT: 'documents',
} as const;

export type StoragePath = (typeof STORAGE_PATHS)[keyof typeof STORAGE_PATHS];

// ---------------------------------------------------------------------------
// Community / Posts
// ---------------------------------------------------------------------------

/** Shown in place of content when a comment is soft-deleted but still returned. */
export const DELETED_COMMENT_MESSAGE = 'This comment was deleted.';
