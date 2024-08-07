import type { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../middlewares/catchAsyncError';
import type { ChapterAndVideoDetails, courseBenefitAndDetails, CourseGeneric, CourseParams, CourseRelations, InsectCourseDetailsBody, insertChapterBody, InsertVideoDetails, ModifiedChapterDetail, TSelectCourse, TSelectCourseBenefit, TSelectVideoDetails } from '../types/index.type';
import { courseBenefitService, courseService, createCourseChapterService, createCourseService, editCourseDetailsService, updateChapterVideoDetailService, updateCourseChapterService } from '../services/course.service';

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
        const { title, description, price, image, prerequisite, tags, visibility
        } = req.body as InsectCourseDetailsBody<CourseGeneric<'update'>> & {tags : string[]};
        
        const currentStudentId : string = req.student!.id;
        const courseCache : TSelectCourse = req.course;

        const updatedDetails : TSelectCourse = await editCourseDetailsService({
            title, description, price, image, teacherId : currentStudentId, prerequisite, visibility
        }, courseId, currentStudentId, tags ?? [], courseCache);
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
        const courseCache : TSelectCourse = req.course;

        const benefitWithCourseId : Omit<TSelectCourseBenefit, 'id'>[] = benefits.map<Omit<TSelectCourseBenefit, 'id'>>(benefit => 
            ({title : benefit.title, details : benefit.details, courseId})
        )

        const {course, benefits : courseBenefit} = await courseBenefitService(benefitWithCourseId, courseId, currentStudentId, courseCache);
        res.status(200).json({success : true, course, benefits : courseBenefit});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const createCourseChapter =  CatchAsyncError(async (req :  Request, res : Response, next : NextFunction) => {
    try {
        const { courseId } = req.params as CourseParams;
        const { chapterDetails, videoDetails } = req.body as insertChapterBody;

        const chapterAndVideoDetails : ChapterAndVideoDetails = await createCourseChapterService(
            videoDetails, chapterDetails, courseId
        );
        res.status(200).json({success : true, ...chapterAndVideoDetails});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const updateCourseChapter = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { visibility, description, title } = req.body as Partial<ModifiedChapterDetail>
        const { courseId, chapterId } = req.params as {courseId : string, chapterId : string};
        const currentTeacherId = req.student!.id;

        const chapterDetail = await updateCourseChapterService(chapterId, courseId, currentTeacherId, {
            visibility, description, title, courseId : courseId
        });
        res.status(200).json({success : true, chapterDetail});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const updateChapterVideoDetail = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { chapterId, videoId } = req.params as {chapterId : string, videoId : string};
        const { state, videoTitle, videoUrl } = req.body as InsertVideoDetails;
        const currentTeacherId : string = req.student!.id;

        const videoDetails : TSelectVideoDetails = await updateChapterVideoDetailService(chapterId, videoId, currentTeacherId, {
            state, videoTitle, videoUrl
        });
        res.status(200).json({status : true, videoDetails});
        
    } catch (error : unknown) {
        return next(error);
    }
})

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