import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

export const redisClient = new Redis(REDIS_URL);
export const redisSubscriber = new Redis(REDIS_URL);

const waitForConnection = () => new Promise<void>((resolve) => {
  if (redisClient.status === 'ready') return resolve();
  redisClient.once('ready', resolve);
});

export { waitForConnection };

redisClient.on('connect', () => console.log('Backend 2 connected to Redis'));
redisSubscriber.on('connect', () => console.log('Backend 2 Subscriber ready'));
redisClient.on('error', (err) => console.error('Backend 2 Redis Error:', err));