import { PAGINATION } from '../constants';
import type { PaginationMeta } from '../utils/response';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Normalise and validate pagination query parameters.
 * Ensures `page` and `limit` are within acceptable bounds.
 */
export function parsePagination(
  params: PaginationParams,
): Required<PaginationParams> {
  const page = Math.max(1, Number(params.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    PAGINATION.MAX_LIMIT,
    Math.max(1, Number(params.limit) || PAGINATION.DEFAULT_LIMIT),
  );
  return { page, limit };
}

/**
 * Calculate database `skip` value from page and limit.
 */
export function getSkip(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Build a `PaginationMeta` object from the query result.
 */
export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const total_pages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    total_pages,
    has_next_page: page < total_pages,
    has_prev_page: page > 1,
  };
}
