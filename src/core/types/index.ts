/**
 * Shared TypeScript types used across the application.
 *
 * Module-specific types live alongside their module (e.g. auth.types.ts).
 * This file holds only truly cross-cutting type definitions.
 *
 * NOTE: The `better-auth/node` module declaration has been removed —
 * better-auth v1.6+ ships its own TypeScript declarations for all
 * sub-path exports including `better-auth/node`.
 */

// ---------------------------------------------------------------------------
// API Response Types (re-exported from utils/response for convenience)
// ---------------------------------------------------------------------------

export type {
  ApiResponse,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginationMeta,
} from '../utils/response';

// ---------------------------------------------------------------------------
// Generic utility types
// ---------------------------------------------------------------------------

/** Make selected properties of T required */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Make all properties of T optional recursively */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Nullable helper */
export type Nullable<T> = T | null;

/** Extract non-nullish keys */
export type NonNullableFields<T> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};

// ---------------------------------------------------------------------------
// Environment type (re-exported for convenience)
// ---------------------------------------------------------------------------

export type { Env } from '../../app/env';
