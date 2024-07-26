// import { Redis } from '@upstash/redis';
import { Redis } from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL);
// export const redis = new Redis({
//     token : process.env.UPSTASH_REDIS_REST_TOKEN, url : process.env.UPSTASH_REDIS_REST_URL
// });