import type { ChainableCommander } from 'ioredis';
import type { TSelectChapter, TSelectCourse } from '../../types/index.type';
import { redis } from './redis.config';
import { ResourceNotFoundError } from '../../libs/utils';
// 1. add pipeline
export const findAllCourseChapter = async (key : string, chapterId : string) : Promise<TSelectChapter | null> => {
    let cursor : string = '0';
    let foundChapter : TSelectChapter | null = null;

    do {
        const [newCursor, keys] : [string, string[]] = await redis.scan(cursor, 'MATCH', key, 'COUNT', 100);
        const pipeline : ChainableCommander = redis.pipeline();
        keys.forEach(key => pipeline.hgetall(key));

        const chaptersDetail : TSelectChapter[] = (await pipeline.exec())!.map(chapter => chapter[1]) as TSelectChapter[];
        foundChapter = chaptersDetail.find(chapter => chapter && chapter.id === chapterId) || null;
        if(foundChapter) return foundChapter;

        cursor = newCursor;
    } while (cursor !== '0');
    return foundChapter;
}

export const findCourseWithChapterId = async (chapterId : string) : Promise<TSelectCourse | undefined> => {
    let cursor : string = '0';

    do {
        const [newCursor, keys] : [string, string[]] = await redis.scan(cursor, 'MATCH', `course:*:chapters:${chapterId}`, 'COUNT', 100);
        const pipeline : ChainableCommander = redis.pipeline();

        keys.forEach(key => pipeline.hgetall(key));
        const chapterDetails : TSelectChapter[] = (await pipeline.exec())!.map(chapter => chapter[1]) as TSelectChapter[];

        const coursePipeline : ChainableCommander = redis.pipeline();
        chapterDetails.forEach(chapter => {
            coursePipeline.hgetall(`course:${chapter.courseId}`);
        });

        const courseResults : TSelectCourse[] = (await coursePipeline.exec())!.map(result => result[1]) as TSelectCourse[];
        for (const courseDetail of courseResults) {
            if (Object.keys(courseDetail).length === 0) throw new ResourceNotFoundError(); 
            return courseDetail as TSelectCourse;
        }

        cursor = newCursor;
    } while (cursor !== '0');
}

export const findManyCache = async <T>(key : string) : Promise<T[]> => {
    let cursor : string = '0';
    const caches : T[] = [];

    do {
        const [newCursor, keys] : [string, string[]] = await redis.scan(cursor, 'MATCH', key, 'COUNT', 100);
        const pipeline : ChainableCommander = redis.pipeline();
        for (const key of keys) {
            pipeline.hgetall(key);
        }
        const result : T[] = (await pipeline.exec())!.map(result => result[1]) as T[];
        caches.push(...result)

        cursor = newCursor;
    } while (cursor !== '0');
    return caches;
}