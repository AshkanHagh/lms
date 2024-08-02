import type { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../middlewares/catchAsyncError';
import type { ChapterAndVideoDetails, courseBenefitAndDetails, CourseGeneric, CourseParams, CourseRelations, InsectCourseDetailsBody, insertChapterBody, TSelectCourse, TSelectCourseBenefit } from '../types/index.type';
import { courseBenefitService, courseService, createCourseChapterService, createCourseService, editCourseDetailsService } from '../services/course.service';

export const createCourse = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { title } = req.body as InsectCourseDetailsBody<CourseGeneric<'insert'>>;
        const currentStudentId : string = req.student!.id;

        const courseDetails : TSelectCourse = await createCourseService({title, teacherId : currentStudentId});
        res.status(200).json({success : true, courseDetails});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const editCourseDetails = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { courseId } = req.params as CourseParams;
        const { title, description, price, image, prerequisite, tags 
        } = req.body as InsectCourseDetailsBody<CourseGeneric<'update'>> & {tags : string[]};
        
        const currentStudentId : string = req.student!.id;

        const updatedDetails : TSelectCourse = await editCourseDetailsService({
            title, description, price, image, teacherId : currentStudentId, prerequisite
        }, courseId, currentStudentId, tags);
        res.status(200).json({success : true, course : updatedDetails});
        
    } catch (error : unknown) {
        return next(error);
    }
})

export const courseBenefit = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { courseId } = req.params as CourseParams;
        const { benefits } = req.body as Pick<courseBenefitAndDetails, 'benefits'>;
        const currentStudentId : string = req.student!.id;

        const benefitWithCourseId : Omit<TSelectCourseBenefit, 'id'>[] = benefits.map<Omit<TSelectCourseBenefit, 'id'>>(benefit => 
            ({title : benefit.title, details : benefit.details, courseId})
        )

        const {course, benefits : courseBenefit} = await courseBenefitService(benefitWithCourseId, courseId, currentStudentId);
        res.status(200).json({success : true, course, benefits : courseBenefit});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const createCourseChapter =  CatchAsyncError(async (req :  Request, res : Response, next : NextFunction) => {
    try {
        const { courseId } = req.params as CourseParams;
        const { chapterDetails, videoDetails } = req.body as insertChapterBody;
        const currentStudentId : string = req.student!.id;

        const chapterAndVideoDetails : ChapterAndVideoDetails = await createCourseChapterService(
            videoDetails, chapterDetails, courseId, currentStudentId
        );
        res.status(200).json({success : true, ...chapterAndVideoDetails});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const course = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { courseId } = req.params as {courseId : string};
        const currentStudentId : string = req.student!.id;

        const courseDetail : CourseRelations = await courseService(currentStudentId, courseId);
        res.status(200).json({success : true, courseDetail});
        
    } catch (error : unknown) {
        return next(error);
    }
});