import { Ratelimit } from '@upstash/ratelimit';
import type { NextFunction, Request, Response } from 'express';
import { redis } from '../database/cache/redis.config';
import ErrorHandler from '../libs/utils/errorHandler';

const cache = new Map();

export class RedisRateLimiter {
    static instance : Ratelimit;
    static getInstance(limit : number | undefined) : Ratelimit {
        if (this.instance) return this.instance;

        const rateLimit = new Ratelimit({
            redis, 
            limiter : Ratelimit.slidingWindow(limit || 1000, '1 h'), 
            ephemeralCache : cache, 
            denyListThreshold : 10000,
        });

        this.instance = rateLimit;
        return this.instance;
    }
}

export const rateLimit = (limit : number) => {
    return async (req : Request, res : Response, next : NextFunction) => {
        const rateLimit = RedisRateLimiter.getInstance(limit);
        const ip = req.ip || 'anonymous';
    
        const { success } = await rateLimit.limit(ip);
        if (!success) return next(new ErrorHandler('Too many requests', 429));
        next();
    }
};