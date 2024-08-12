import { StudentNotFoundError } from '../../libs/utils';
import type { TSelectCourse, TSelectStudent } from '../../types/index.type';
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

export const findStudentStates = async <T>(currentStudentId : string, coursesId : string[]) : Promise<T[]> => {
    const pipeline = redis.pipeline();
    coursesId.forEach(id => pipeline.hgetall(`student_state:${currentStudentId}:course:${id}`));
    return (await pipeline.exec())!.map(course => course[1]).filter(courseData => Object.keys(courseData!).length > 0) as T[];
};

export const findTeacherCoursesCache = async (currentTeacherId : string) : 
Promise<Pick<TSelectCourse, 'id' | 'title' | 'price' | 'visibility'>[]> => {
    let cursor : string = '0';
    const teacherCourses : Pick<TSelectCourse, 'id' | 'title' | 'price' | 'visibility'>[] = [];
    
    do {
        const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'course:*', 'COUNT', 100);
        const pipeline = redis.pipeline();
        keys.forEach(key => pipeline.hgetall(key));

        const courses : TSelectCourse[] = (await pipeline.exec())!.map(course => course[1]) as TSelectCourse[];
        courses.filter(course => course.teacherId === currentTeacherId).forEach(course => 
            teacherCourses.push({
                id : course.id, title : course.title, price : course.price, visibility : course.visibility
            })
        );

        cursor = newCursor;
    } while (cursor !== '0');
    return teacherCourses;
};