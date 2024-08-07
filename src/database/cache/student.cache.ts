import { StudentNotFoundError } from '../../libs/utils';
import type { TSelectStudent } from '../../types/index.type';
import { getAllHashCache } from './index.cache';
import { redis } from './redis.config';

export const findStudentWithEmailSearch = async (email : string | null) : Promise<TSelectStudent | undefined> => {
    if(!email) throw new StudentNotFoundError();
    let cursor = '0';
    let matchedStudent : TSelectStudent | undefined = undefined;

    do {
        const [newCursor, keys] : [string, string[]] = await redis.scan(cursor, 'MATCH', 'student:*', 'COUNT', 100);
        await Promise.all(keys.map(async key => {
            const student : TSelectStudent = await getAllHashCache<TSelectStudent>(key);
            if(student.email === email) return matchedStudent = student;
        }));
        
        cursor = newCursor;
    } while (cursor !== '0');
    return matchedStudent;
}