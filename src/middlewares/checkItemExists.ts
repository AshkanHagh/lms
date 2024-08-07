import type { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from './catchAsyncError';
import type { TErrorHandler, TSelectCourse } from '../types/index.type';
import ErrorHandler from '../libs/utils/errorHandler';
import { getAllHashCache } from '../database/cache/index.cache';
import { ForbiddenError, ResourceNotFoundError } from '../libs/utils';

type ConditionType = 'teacher_mode' | 'normal';

export const isCourseExists = <T extends ConditionType>(condition : T) => {
    return CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
        try {
            const { courseId } = req.params as {courseId : string};
            const desiredCourse : TSelectCourse = await getAllHashCache(`course:${courseId}`);

            const conditionHandlers : Record<ConditionType, (desiredCorse : TSelectCourse, req : Request) => void> = {
                normal : normalCondition,
                teacher_mode : teacherModeCondition
            }

            conditionHandlers[condition](desiredCourse, req);
            next();
            
        } catch (err : unknown) {
            const error = err as TErrorHandler;
            return next(new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode));
        }
    })
};

const normalCondition = (desiredCourse : TSelectCourse, req : Request) => {
    if(!desiredCourse || Object.keys(desiredCourse).length === 0) throw new ResourceNotFoundError();
    req.course = desiredCourse;
}

const teacherModeCondition = (desiredCourse : TSelectCourse, req : Request) => {
    const currentStudentId : string = req.student!.id
    if(!desiredCourse || Object.keys(desiredCourse).length === 0) throw new ResourceNotFoundError();
    if(currentStudentId !== desiredCourse.teacherId) throw new ForbiddenError();
    req.course = desiredCourse;
}