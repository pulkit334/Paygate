import RedisLib from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redisClient = new RedisLib(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    return Math.min(times * 2, 2000);
  },
});
export const redisSubscriber = new RedisLib(REDIS_URL);
