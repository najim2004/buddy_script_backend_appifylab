import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { redis } from '../infrastructure/redis/redis';

declare module 'fastify' {
  interface FastifyInstance {
    redis: typeof redis;
  }
}

const redisPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async (instance) => {
    await instance.redis.quit();
  });
});

export default redisPlugin;
