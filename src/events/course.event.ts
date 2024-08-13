import { EventEmitter } from 'node:events';
import { findManyCourse, findModifiedCourse } from '../database/queries/course.query';
import type { TErrorHandler, TSelectCourse, VectorSeed } from '../types/index.type';
import { vectorRedis } from '../database/cache/redis.config';
import ErrorHandler from '../libs/utils/errorHandler';

export const courseEvent = new EventEmitter();

courseEvent.on('seed_vector_one', async (courseId : string) => {
    const modifiedCourse : VectorSeed = await findModifiedCourse(courseId) as VectorSeed;
    const { visibility, ...course } = modifiedCourse;
    if(visibility === 'publish') {
        const vectorSeed = {
            id : modifiedCourse.id,
            data : `${modifiedCourse.title} ${modifiedCourse.description}`, metadata : {...course}
        }
        await vectorRedis.upsert(vectorSeed);
    }
});

courseEvent.on('seed_vector_many', async () => {
    try {
        const courses : TSelectCourse[] = await findManyCourse(undefined, undefined);
        const vectorSeed = courses.map(course => {
            return {id : course.id, data : `${course.title} ${course.description}`, metadata : {
                id : course.id, image : course.image, title : course.title, description : course.description, price : course.price
            }};
        });
        await vectorRedis.upsert(vectorSeed);
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
});