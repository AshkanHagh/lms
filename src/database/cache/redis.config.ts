import { Redis } from 'ioredis';
import { Index } from '@upstash/vector';

export const redis = new Redis(process.env.REDIS_URL);

export const vectorRedis = new Index({
    url : process.env.UPSTASH_VECTOR_REST_URL,
    token : process.env.UPSTASH_VECTOR_REST_TOKEN
});