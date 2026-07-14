/**
 * Standardised API response builder.
 *
 * Every API endpoint should return a consistent JSON shape so clients can
 * reliably parse success and error states without inspecting HTTP status codes.
 *
 * Success shape:
 *   { success: true, data: T, message?: string, meta?: PaginationMeta }
 *
 * Error shape:
 *   { success: false, code: string, message: string, errors?: unknown }
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

export interface CursorPaginationMeta {
  next_cursor: string | null;
  has_next_page: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta | CursorPaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  errors?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Build a success response payload.
 */
export function successResponse<T>(
  data: T,
  message?: string,
  meta?: PaginationMeta | CursorPaginationMeta,
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta }),
  };
}

/**
 * Build an error response payload.
 */
export function errorResponse(
  message: string,
  code = 'INTERNAL_SERVER_ERROR',
  errors?: unknown,
): ApiErrorResponse {
  return {
    success: false,
    code,
    message,
    ...(errors !== undefined && { errors }),
  };
}
