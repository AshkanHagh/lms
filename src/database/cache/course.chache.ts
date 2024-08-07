import type { TSelectChapter } from '../../types/index.type';
import { getAllHashCache } from './index.cache';
import { redis } from './redis.config';

export const findAllCourseChapter = async (key : string, chapterId : string) => {
    let cursor : string = '0';
    let foundChapter : TSelectChapter | null = null;

    const checkChapter = async (key : string) : Promise<TSelectChapter | null> => {
        const chapter : TSelectChapter = await getAllHashCache(key);
        return chapter.id === chapterId ? chapter : null
    }

    do {
        const [newCursor, keys] : [string, string[]] = await redis.scan(cursor, 'MATCH', key, 'COUNT', 100);
        const chapters : (TSelectChapter | null)[] | null = await Promise.all(keys.map(checkChapter));
        foundChapter = chapters.find(chapter => chapter !== null) || null as TSelectChapter | null;
        cursor = newCursor;

    } while (cursor !== '0');
    return foundChapter;
}