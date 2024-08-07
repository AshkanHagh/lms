import { ResourceNotFoundError } from '../../libs/utils';
import type { TSelectChapter, TSelectCourse } from '../../types/index.type';
import { getAllHashCache } from './index.cache';
import { redis } from './redis.config';

export const findAllCourseChapter = async (key : string, chapterId : string) : Promise<TSelectChapter | null> => {
    let cursor : string = '0';
    let foundChapter : TSelectChapter | null = null;

    const checkChapter = async (key : string) : Promise<TSelectChapter | null> => {
        const chapter : TSelectChapter = await getAllHashCache(key);
        return chapter.id === chapterId ? chapter : null
    }

    do {
        const [newCursor, keys] : [string, string[]] = await redis.scan(cursor, 'MATCH', key, 'COUNT', 100);
        const chapters : (TSelectChapter | null)[] | null = await Promise.all(keys.map(checkChapter));
        foundChapter = chapters.find(chapter => chapter !== null) as TSelectChapter;
        cursor = newCursor;

    } while (cursor !== '0');
    return foundChapter;
}

export const findCourseWithChapterId = async (chapterId : string) : Promise<TSelectCourse | undefined> => {
    let cursor : string = '0';

    do {
        const [newCursor, keys] : [string, string[]] = await redis.scan(cursor, 'MATCH', `course:*:chapters:${chapterId}`, 'COUNT', 100);
        for (const key of keys) {
            const chapterDetails : TSelectChapter | undefined = await getAllHashCache<TSelectChapter>(key);
            const courseDetail : TSelectCourse | undefined = await getAllHashCache<TSelectCourse>(`course:${chapterDetails.courseId}`);
            if(Object.keys(courseDetail).length === 0) throw new ResourceNotFoundError();
            return courseDetail as TSelectCourse;
        }

        cursor = newCursor;
    } while (cursor !== '0');
}

export const findAllChapters = async (key : string) : Promise<TSelectChapter[]> => {
    let cursor : string = '0';
    const chapters : TSelectChapter[] = [];

    do {
        const [newCursor, keys] : [string, string[]] = await redis.scan(cursor, 'MATCH', key, 'COUNT', 100);
        for (const key of keys) {
            const courseChapterDetails : TSelectChapter = await getAllHashCache<TSelectChapter>(key);
            chapters.push(courseChapterDetails);
        }

        cursor = newCursor;
    } while (cursor !== '0');
    return chapters;
}