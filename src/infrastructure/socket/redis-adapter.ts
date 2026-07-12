import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import env from '../../app/env';

export const createSocketRedisAdapter = () => {
  const pubClient = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
  });

  const subClient = pubClient.duplicate();

  return createAdapter(pubClient, subClient);
};

export default createSocketRedisAdapter;
