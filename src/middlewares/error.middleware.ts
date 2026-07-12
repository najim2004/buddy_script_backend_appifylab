import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../core/errors/app.error';

/**
 * Global Fastify error handler.
 *
 * Handles three categories of errors:
 *  1. `AppError` subclasses — operational errors with a known HTTP status
 *  2. `ZodError`           — validation failures from zod schemas
 *  3. `FastifyError`       — framework-level errors (route not found, etc.)
 *  4. Unknown errors       — unexpected programming bugs (logged, 500 returned)
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
    reply.status(error.statusCode).send({
      success: false,
      code: error.code,
      message: error.message,
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // 2. Zod validation errors — 422 Unprocessable Entity
  // ---------------------------------------------------------------------------
  if (error instanceof ZodError) {
    request.log.warn({ issues: error.issues }, 'Validation error');
    reply.status(422).send({
      success: false,
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // 3. Fastify framework errors (404, 405, rate-limit, etc.)
  // ---------------------------------------------------------------------------
  const fastifyError = error as FastifyError;
  if (fastifyError.statusCode) {
    request.log.warn(
      { statusCode: fastifyError.statusCode, code: fastifyError.code },
      fastifyError.message,
    );
    reply.status(fastifyError.statusCode).send({
      success: false,
      code: fastifyError.code ?? 'REQUEST_ERROR',
      message: fastifyError.message,
    });
    return;
  }

  // ---------------------------------------------------------------------------
  // 4. Unknown / programming errors — log full error, return generic 500
  // ---------------------------------------------------------------------------
  request.log.error({ err: error }, 'Unhandled error');
  reply.status(500).send({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred. Please try again later.',
  });
};

export default errorMiddleware;
