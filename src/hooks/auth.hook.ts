import { FastifyReply, FastifyRequest } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import auth from '../infrastructure/auth/better-auth';
import { UnauthorizedError } from '../core/errors/app.error';
import type { AuthUserPayload } from '../modules/auth/auth.types';

/**
 * Standalone preHandler hook for session-based authentication.
 *
 * Use this for individual routes or scoped route groups when you need
 * authentication without the `fastify.authenticate` decorator approach.
 * Both implementations share the same Better Auth session validation.
 *
 * Throws `UnauthorizedError` on failure (handled by the global error handler).
 *
 * Usage:
 *   fastify.get('/protected', { preHandler: [authHook] }, handler)
 */
export const authHook = async (
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session) {
    throw new UnauthorizedError();
  }

  request.user = {
    userId: session.user.id,
    email: session.user.email,
    type: (session.user as { role?: string }).role ?? 'user',
  } satisfies AuthUserPayload;
};

export default authHook;
