import type { TInsertCache } from '../../types/index.type';
import { redis } from './redis.config';

export const insertHashCache = async <T>(hashKey : string, keyValue : TInsertCache<T>) : Promise<void> => {
    await redis.hset(hashKey, keyValue);
    await redis.expire(hashKey, 604800);
}

export const getAllHashCache = async <T>(hashKey : string) : Promise<T> => {
    await redis.expire(hashKey, 604800);
    return await redis.hgetall(hashKey) as T;
}

export const deleteHashCache = async (hashKey : string) : Promise<void> => {
    await redis.del(hashKey);
}

export const getHashCache = async <T>(hashKey : string, hashIndex : string) : Promise<T> => {
    await redis.expire(hashKey, 604800);
    return await redis.hget(hashKey, hashIndex) as T;
}

export const insertHashListCache = async <T>(hashKey : string, hashIndex : string, hashValue : T) : Promise<void> => {
    await redis.expire(hashKey, 604800);
    await redis.hmset(hashKey, hashIndex, JSON.stringify(hashValue));
}

export const removeFromHashListCache = async (hashKey : string, hashIndex : string) : Promise<void> => {
    await redis.hdel(hashKey, hashIndex);
}

export const insertSetListCache = async (setKey : string, setValue : string) : Promise<void> => {
    await redis.sadd(setKey, setValue);
}

export const getSetListCache = async (setKey : string, setIndex : string) => {
    return await redis.sismember(setKey, setIndex);
}

export const getAllSetListCache = async (setKey : string) : Promise<string[]> => {
    return await redis.smembers(setKey);
}