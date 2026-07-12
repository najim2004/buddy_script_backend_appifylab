import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../core/errors/app.error';

import { errorResponse } from '../core/utils/response';

/**
 * Global Fastify error handler.
 *
 * Handles three categories of errors:
 *  1. `AppError` subclasses — operational errors with a known HTTP status
 *  2. `FastifyError`       — framework-level errors (route not found, validation, etc.)
 *  3. Unknown errors       — unexpected programming bugs (logged, 500 returned)
 */
export const errorMiddleware = (
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void => {
  // ---------------------------------------------------------------------------
  // 1. Operational AppErrors — map to their pre-set HTTP status code
  // ---------------------------------------------------------------------------
  if (error instanceof AppError) {
    request.log.warn(
      { code: error.code, statusCode: error.statusCode },
      error.message,
    );
    reply
      .status(error.statusCode)
      .send(errorResponse(error.message, error.code));
    return;
  }

  // ---------------------------------------------------------------------------
  // 2. Validation errors (TypeBox / Fastify native) are handled below in generic FastifyError
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  const fastifyError = error as FastifyError;
  if (fastifyError.statusCode) {
    request.log.warn(
      { statusCode: fastifyError.statusCode, code: fastifyError.code },
      fastifyError.message,
    );
    reply
      .status(fastifyError.statusCode)
      .send(
        errorResponse(
          fastifyError.message,
          fastifyError.code ?? 'REQUEST_ERROR',
        ),
      );
    return;
  }

  // ---------------------------------------------------------------------------
  // 4. Unknown / programming errors — log full error, return generic 500
  // ---------------------------------------------------------------------------
  request.log.error({ err: error }, 'Unhandled error');
  reply
    .status(500)
    .send(
      errorResponse(
        'An unexpected error occurred. Please try again later.',
        'INTERNAL_SERVER_ERROR',
      ),
    );
};

export default errorMiddleware;
