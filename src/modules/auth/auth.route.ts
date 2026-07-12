import { FastifyInstance } from 'fastify';
import authController from './auth.controller';
import { SWAGGER_TAGS } from '../../docs/swagger';
import {
  signUpSchema,
  signInSchema,
  authMeResponseSchema,
} from './auth.schema';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { fromNodeHeaders } from 'better-auth/node';
import auth from '../../infrastructure/auth/better-auth';

export const authRoute = async (fastify: FastifyInstance): Promise<void> => {
  const typedFastify = fastify.withTypeProvider<TypeBoxTypeProvider>();

  // ---------------------------------------------------------------------------
  // POST /api/auth/sign-up - Register with email and password
  // ---------------------------------------------------------------------------
  typedFastify.post(
    '/sign-up',
    {
      schema: {
        tags: [SWAGGER_TAGS.AUTH],
        summary: 'Register with email and password',
        body: signUpSchema,
      },
    },
    authController.signUp.bind(authController),
  );

  // ---------------------------------------------------------------------------
  // POST /api/auth/sign-in - Login with email and password
  // ---------------------------------------------------------------------------
  typedFastify.post(
    '/sign-in',
    {
      schema: {
        tags: [SWAGGER_TAGS.AUTH],
        summary: 'Login with email and password',
        body: signInSchema,
      },
    },
    authController.signIn.bind(authController),
  );

  // ---------------------------------------------------------------------------
  // POST /api/auth/sign-out - Logout user
  // ---------------------------------------------------------------------------
  fastify.post(
    '/sign-out',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.AUTH],
        summary: 'Logout user',
        security: [{ bearerAuth: [] }],
      },
    },
    authController.signOut.bind(authController),
  );

  // ---------------------------------------------------------------------------
  // GET /api/auth/me - Get authenticated user profile
  // ---------------------------------------------------------------------------
  fastify.get(
    '/me',
    {
      preHandler: [fastify.authenticate],
      schema: {
        tags: [SWAGGER_TAGS.AUTH],
        summary: 'Get authenticated user profile',
        security: [{ bearerAuth: [] }],
        response: {
          200: authMeResponseSchema,
        },
      },
    },
    authController.me.bind(authController),
  );

  // ---------------------------------------------------------------------------
  // Better Auth catch-all proxy
  // Forwards every unmatched /api/auth/* request to Better Auth's handler.
  // ---------------------------------------------------------------------------

  fastify.all(
    '/*',
    {
      schema: {
        hide: true,
      },
    },
    async (request, reply) => {
      const url = new URL(
        request.url,
        `${request.protocol}://${request.headers.host}`,
      );

      const req = new Request(url.toString(), {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        body:
          request.method !== 'GET' && request.method !== 'HEAD'
            ? JSON.stringify(request.body)
            : undefined,
      });

      const response = await auth.handler(req);

      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));

      return reply.send(response.body ? await response.text() : null);
    },
  );
};

export default authRoute;
