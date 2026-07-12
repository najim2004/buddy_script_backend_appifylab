import { FastifyReply, FastifyRequest } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import auth from '../infrastructure/auth/better-auth';
import { UnauthorizedError } from '../core/errors/app.error';
import type { AuthUserPayload } from '../modules/auth/auth.types';

/**
 * Express-style auth middleware shim.
 *
 * Validates the Better Auth session from request headers and attaches
 * the authenticated user payload to `request.user`.
 *
 * NOTE: In Fastify the preferred pattern is to use preHandler hooks.
 * Consider using `fastify.authenticate` (registered by jwt.plugin) or
 * `authHook` (src/hooks/auth.hook.ts) instead for route-level auth.
 *
 * This middleware exists for compatibility with middleware-based patterns
 * and can be used with `addHook('preHandler', authMiddleware)` on a scoped
 * Fastify instance.
 */
export const authMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  try {
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
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      reply.status(401).send({ success: false, message: err.message });
      return;
    }
    reply.status(401).send({ success: false, message: 'Unauthorized' });
  }
};

export default authMiddleware;
