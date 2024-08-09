import { StudentNotFoundError } from '../../libs/utils';
import type { TSelectStudent } from '../../types/index.type';
import { redis } from './redis.config';

export const findStudentWithEmailSearch = async (email : string | null) : Promise<TSelectStudent | undefined> => {
    if(!email) throw new StudentNotFoundError();
    let cursor = '0';
    let matchedStudent : TSelectStudent | undefined = undefined;

    do {
        const [newCursor, keys] : [string, string[]] = await redis.scan(cursor, 'MATCH', 'student:*', 'COUNT', 100);
        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.hgetall(key));

        (await pipeline.exec())!.forEach(studentArray => {
            const student : TSelectStudent = studentArray[1] as TSelectStudent;
            if(student.email === email) matchedStudent = student;
        });
        
        cursor = newCursor;
    } while (cursor !== '0');
    return matchedStudent;
}