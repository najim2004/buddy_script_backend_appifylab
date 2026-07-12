import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { initSocketServer } from '../infrastructure/socket/io';
import { Server } from 'socket.io';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

const socketPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const io = initSocketServer(fastify.server);
  fastify.decorate('io', io);

  fastify.addHook('onClose', (instance, done) => {
    instance.io.close(done);
  });
});

export default socketPlugin;
