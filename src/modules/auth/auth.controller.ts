import { FastifyReply, FastifyRequest } from 'fastify';
import auth from '../../infrastructure/auth/better-auth';
import authService from './auth.service';
import { successResponse } from '../../core/utils/response';
import { SignUpDto, SignInDto } from './auth.schema';
import { fromNodeHeaders } from 'better-auth/node';

export class AuthController {
  private forwardCookies(result: { headers?: Headers }, reply: FastifyReply) {
    const cookies = result.headers?.getSetCookie?.() ?? [];
    cookies.forEach((cookie) => reply.header('set-cookie', cookie));
  }

  // ---------------------------------------------------------------------------
  // POST /api/auth/sign-up - Register with email and password
  // ---------------------------------------------------------------------------

  async signUp(
    request: FastifyRequest<{ Body: SignUpDto }>,
    reply: FastifyReply,
  ): Promise<void> {
    const body: SignUpDto = request.body;
    const result = await auth.api.signUpEmail({
      body: {
        ...body,
        name: '',
      },
      headers: fromNodeHeaders(request.headers),
      returnHeaders: true,
    });

    this.forwardCookies(result, reply);
    return reply.send(
      successResponse(result.response || result, 'Registration successful'),
    );
  }

  // ---------------------------------------------------------------------------
  // POST /api/auth/sign-in - Login with email and password
  // ---------------------------------------------------------------------------
  async signIn(
    request: FastifyRequest<{ Body: SignInDto }>,
    reply: FastifyReply,
  ): Promise<void> {
    const result = await auth.api.signInEmail({
      body: {
        email: request.body.email,
        password: request.body.password,
      },
      headers: fromNodeHeaders(request.headers),
      returnHeaders: true,
    });

    this.forwardCookies(result, reply);
    return reply.send(
      successResponse(result.response || result, 'Login successful'),
    );
  }

  // ---------------------------------------------------------------------------
  // POST /api/auth/sign-out - Logout user
  // ---------------------------------------------------------------------------
  async signOut(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const result = await auth.api.signOut({
      headers: fromNodeHeaders(request.headers),
      returnHeaders: true,
    });

    this.forwardCookies(result, reply);
    return reply.send(successResponse(null, 'Logout successful'));
  }

  // ---------------------------------------------------------------------------
  // GET /api/auth/me - Get authenticated user profile
  // ---------------------------------------------------------------------------
  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = request.user;
    const user = await authService.me(userId);
    reply.send(successResponse(user, 'User profile retrieved'));
  }
}

export const authController = new AuthController();
export default authController;
