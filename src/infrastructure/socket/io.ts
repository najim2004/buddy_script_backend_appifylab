import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { createSocketRedisAdapter } from './redis-adapter';
import env from '../../app/env';
import logger from '../../app/logger';

let io: Server | null = null;

/**
 * Initialise the Socket.io server and attach the Redis pub/sub adapter.
 *
 * Should be called once during application bootstrap (via socket.plugin.ts).
 * Use `getIo()` anywhere in the app to access the singleton instance.
 */
export const initSocketServer = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      // Use the configured client origin — never '*' in production
      origin: env.NODE_ENV === 'production' ? env.CLIENT_APP_URL : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Graceful degradation: prefer WebSocket, fall back to polling
    transports: ['websocket', 'polling'],
  });

  const adapter = createSocketRedisAdapter();
  io.adapter(adapter as Parameters<typeof io.adapter>[0]);

  io.on('connection', (socket) => {
    logger.debug({ socketId: socket.id }, '🔌 Client connected');

    socket.on('disconnect', (reason) => {
      logger.debug({ socketId: socket.id, reason }, '🔌 Client disconnected');
    });

    socket.on('error', (err) => {
      logger.error({ socketId: socket.id, err }, 'Socket error');
    });
  });

  logger.info('🔌 Socket.io server initialised');

  return io;
};

/**
 * Retrieve the Socket.io singleton.
 * Throws if called before `initSocketServer()`.
 */
export const getIo = (): Server => {
  if (!io) {
    throw new Error(
      'Socket.io has not been initialised. Call initSocketServer() first.',
    );
  }
  return io;
};
