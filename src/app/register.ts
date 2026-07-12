import { FastifyInstance } from 'fastify';
import authRoute from '../modules/auth/auth.route';
import userRoute from '../modules/users/user.route';
import postsRoute from '../modules/posts/posts.route';
import notificationsRoute from '../modules/notifications/notifications.route';
import chatsRoute from '../modules/chats/chats.route';
import paymentsRoute from '../modules/payments/payments.route';
import adminRoute from '../modules/admin/admin.route';
import storageServeRoute from '../modules/storage/storage.serve.route';

export const registerRoutes = async (
  fastify: FastifyInstance,
): Promise<void> => {
  await fastify.register(authRoute, { prefix: '/api/auth' });
  await fastify.register(userRoute, { prefix: '/api/users' });
  await fastify.register(postsRoute, { prefix: '/api/posts' });
  await fastify.register(notificationsRoute, { prefix: '/api/notifications' });
  await fastify.register(chatsRoute, { prefix: '/api/chats' });
  await fastify.register(paymentsRoute, { prefix: '/api/payments' });
  await fastify.register(adminRoute, { prefix: '/api/admin' });
  await fastify.register(storageServeRoute, { prefix: '/api/files' });
};

export default registerRoutes;
