import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../infrastructure/prisma/client';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

const prismaPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
});

export default prismaPlugin;
