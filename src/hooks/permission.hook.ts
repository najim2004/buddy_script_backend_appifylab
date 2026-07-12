import { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError } from '../core/errors/app.error';
import { USER_TYPES, type UserType } from '../core/constants';

/**
 * Factory that returns a preHandler hook enforcing role-based access.
 *
 * Must be used AFTER `fastify.authenticate` or `authHook` so that
 * `request.user` is already populated.
 *
 * Usage (single role):
 *   fastify.get('/admin', {
 *     preHandler: [fastify.authenticate, permissionHook('admin')],
 *   }, handler);
 *
 * Usage (multiple allowed roles):
 *   fastify.get('/dashboard', {
 *     preHandler: [fastify.authenticate, permissionHook(['admin', 'moderator'])],
 *   }, handler);
 */
export const permissionHook = (requiredRole: UserType | UserType[]) => {
  const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  return async (
    request: FastifyRequest,
    _reply: FastifyReply,
  ): Promise<void> => {
    const { type } = request.user;

    if (!type || !allowed.includes(type as UserType)) {
      throw new ForbiddenError(
        `Access denied. Required role: ${allowed.join(' or ')}.`,
      );
    }
  };
};

export { USER_TYPES };
export default permissionHook;
