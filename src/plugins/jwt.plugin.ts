import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import auth from '../infrastructure/auth/better-auth';
import { UnauthorizedError } from '../core/errors/app.error';
import type { AuthUserPayload } from '../modules/auth/auth.types';

declare module 'fastify' {
  interface FastifyInstance {
    /**
     * Prehandler that validates the Better Auth session and attaches
     * the decoded user payload to `request.user`.
     *
     * Usage:
     *   fastify.get('/protected', { preHandler: [fastify.authenticate] }, handler)
     */
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    user: AuthUserPayload;
  }
}

const jwtPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
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
    },
  );
});

export default jwtPlugin;
