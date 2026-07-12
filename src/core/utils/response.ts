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
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: PaginationMeta;
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
  meta?: PaginationMeta,
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
