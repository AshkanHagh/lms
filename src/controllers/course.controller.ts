import type { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../middlewares/catchAsyncError';
import type { ChapterAndVideoDetails, courseBenefitAndDetails, CourseParams, InsectCourseDetailsBody, insertChapterBody, TSelectCourse, TSelectCourseBenefit } from '../types/index.type';
import { courseBenefitService, createCourseChapterService, createCourseService, editCourseDetailsService } from '../services/course.service';

export const createCourse = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { title, details, price, image, prerequisite } = req.body as InsectCourseDetailsBody;
        const currentUserId : string = req.user!.id;

        const courseDetails : TSelectCourse = await createCourseService({
            title, details, price, image, prerequisite, teacherId : currentUserId
        });
        res.status(200).json({success : true, courseDetails});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const editCourseDetails = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { courseId } = req.params as CourseParams;
        const { title, details, price, image, prerequisite, tags } = req.body as InsectCourseDetailsBody & {tags : string[]};
        const currentUserId = req.user!.id;

        const updatedDetails : TSelectCourse = await editCourseDetailsService({
            title, details, price, image, teacherId : currentUserId, prerequisite
        }, courseId, currentUserId, tags);
        res.status(200).json({success : true, course : updatedDetails});
        
    } catch (error : unknown) {
        return next(error);
    }
})

export const courseBenefit = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { courseId } = req.params as CourseParams;
        const { benefits } = req.body as Pick<courseBenefitAndDetails, 'benefits'>;
        const currentUserId = req.user!.id;

        const benefitWithCourseId : Omit<TSelectCourseBenefit, 'id'>[] = benefits.map<Omit<TSelectCourseBenefit, 'id'>>(benefit => 
            ({title : benefit.title, details : benefit.details, courseId})
        )

        const {course, benefits : courseBenefit} = await courseBenefitService(benefitWithCourseId, courseId, currentUserId);
        res.status(200).json({success : true, course, benefits : courseBenefit});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const createCourseChapter =  CatchAsyncError(async (req :  Request, res : Response, next : NextFunction) => {
    try {
        const { courseId } = req.params as CourseParams;
        const { chapterDetails, videoDetails } = req.body as insertChapterBody;
        const currentUserId : string = req.user!.id;

        const chapterAndVideoDetails : ChapterAndVideoDetails = await createCourseChapterService(
            videoDetails, chapterDetails, courseId, currentUserId
        );
        res.status(200).json({success : true, ...chapterAndVideoDetails});
        
    } catch (error : unknown) {
        return next(error);
    }
});