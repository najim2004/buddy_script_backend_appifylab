import { FastifyReply, FastifyRequest } from 'fastify';
import { fromNodeHeaders } from 'better-auth/node';
import auth from '../../infrastructure/auth/better-auth';
import authService from './auth.service';
import { successResponse } from '../../core/utils/response';
import { SignUpDto, SignInDto } from './auth.schema';

export class AuthController {
  private forwardCookies(result: { headers?: Headers }, reply: FastifyReply) {
    const cookies = result.headers?.getSetCookie?.() ?? [];
    cookies.forEach((cookie) => reply.header('set-cookie', cookie));
  }

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

  async me(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { userId } = request.user;
    const user = await authService.me(userId);
    reply.send(successResponse(user, 'User profile retrieved'));
  }
}

export const authController = new AuthController();
export default authController;
