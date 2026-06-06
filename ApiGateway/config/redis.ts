import Redis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

export const redisClient = new Redis(REDIS_URL);

redisClient.on('connect', () => console.log('Backend 1 connected to Redis'));
redisClient.on('error', (err) => console.error('Backend 1 Redis Error:', err));