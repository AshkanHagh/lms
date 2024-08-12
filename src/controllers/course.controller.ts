import type { Request, Response } from 'express';
import { CatchAsyncError } from '../middlewares/catchAsyncError';
import type { ChapterAndVideoDetails, ChapterAndVideoId, ChapterDetails, CourseAndChapterId, CourseAndVideoId, courseBenefitAndDetails, CourseGeneric, CourseParams, CourseRelations, CourseStateResult, InsectCourseDetailsBody, insertChapterBody, InsertVideoDetails, ModifiedChapterDetail, PaginationQuery, SelectVideoCompletion, TSelectChapter, TSelectCourse, TSelectCourseBenefit, TSelectStudent, TSelectTags, TSelectVideoDetails, VectorSeed } from '../types/index.type';
import { courseBenefitService, courseChapterDetailsService, courseService, coursesService, courseStateDetailService, courseVideosDetailService, createCourseChapterService, createCourseService, editCourseDetailsService, filterCourseByTagsService, markAsCompletedService, mostUsedTagsService, updateChapterVideoDetailService, updateCourseChapterService, vectorSearchService } from '../services/course.service';

export const createCourse = CatchAsyncError(async (req : Request, res : Response) => {
    const { title } = req.body as InsectCourseDetailsBody<CourseGeneric<'insert'>>;
    const currentStudentId : string = req.student!.id;

    const courseDetails : TSelectCourse = await createCourseService({title, teacherId : currentStudentId});
    res.status(200).json({success : true, courseDetails});
});

export const editCourseDetails = CatchAsyncError(async (req : Request, res : Response) => {
    const { courseId } = req.params as CourseParams;
    const { title, description, price, image, prerequisite, tags, visibility
    } = req.body as InsectCourseDetailsBody<CourseGeneric<'update'>> & {tags : string[]};
    
    const currentStudentId : string = req.student!.id;
    const courseCache : TSelectCourse = req.course;

    const updatedDetails : TSelectCourse = await editCourseDetailsService({
        title, description, price, image, teacherId : currentStudentId, prerequisite, visibility
    }, courseId, tags ?? [], courseCache);
    res.status(200).json({success : true, course : updatedDetails});
})

export const courseBenefit = CatchAsyncError(async (req : Request, res : Response) => {
    const { benefits } = req.body as Pick<courseBenefitAndDetails, 'benefits'>;
    const courseDetail : TSelectCourse = req.course;

    const benefitWithCourseId : Omit<TSelectCourseBenefit, 'id'>[] = benefits.map<Omit<TSelectCourseBenefit, 'id'>>(benefit => 
        ({title : benefit.title, details : benefit.details, courseId : courseDetail.id})
    )
    const {course, benefits : courseBenefit} = await courseBenefitService(benefitWithCourseId, courseDetail);
    res.status(200).json({success : true, course, benefits : courseBenefit});
});

export const createCourseChapter =  CatchAsyncError(async (req :  Request, res : Response) => {
    const { courseId } = req.params as CourseParams;
    const { chapterDetails, videoDetails } = req.body as insertChapterBody;

    const chapterAndVideoDetails : ChapterAndVideoDetails = await createCourseChapterService(
        videoDetails, chapterDetails, courseId
    );
    res.status(200).json({success : true, ...chapterAndVideoDetails});
});

export const updateCourseChapter = CatchAsyncError(async (req : Request, res : Response) => {
    const { visibility, description, title } = req.body as Partial<ModifiedChapterDetail>
    const { courseId, chapterId } = req.params as CourseAndChapterId;

    const chapterDetail : TSelectChapter = await updateCourseChapterService(chapterId, courseId, {
        visibility, description, title, courseId : courseId
    });
    res.status(200).json({success : true, chapterDetail});
});

export const updateChapterVideoDetail = CatchAsyncError(async (req : Request, res : Response) => {
    const { chapterId, videoId } = req.params as ChapterAndVideoId
    const { state, videoTitle, videoUrl } = req.body as InsertVideoDetails;
    const currentTeacherId : string = req.student!.id;

    const videoDetails : TSelectVideoDetails = await updateChapterVideoDetailService(chapterId, videoId, currentTeacherId, {
        state, videoTitle, videoUrl
    });
    res.status(200).json({status : true, videoDetails});
})

export const courseDetails = CatchAsyncError(async (req : Request, res : Response) => {
    const currentStudent : TSelectStudent = req.student!;
    const currentCourseId : string = req.course!.id;

    const courseDetail : CourseRelations = await courseService(currentStudent, currentCourseId);
    res.status(200).json({success : true, courseDetail});
});

export const courseChapterDetails = CatchAsyncError(async (req : Request, res : Response) => {
    const { courseId, chapterId } = req.params as CourseAndChapterId;
    const { plan, id } : TSelectStudent = req.student!;

    const chapterDetails : ChapterDetails = await courseChapterDetailsService(courseId, chapterId, {plan, id});
    res.status(200).json({success : true, ...chapterDetails});
});

export const courseVideosDetail = CatchAsyncError(async (req : Request, res : Response) => {
    const { videoId, chapterId } = req.params as ChapterAndVideoId;
    const currentStudentId : string = req.student!.id;

    const videoDetail : TSelectVideoDetails = await courseVideosDetailService(videoId, chapterId, currentStudentId);
    res.status(200).json({success : true, videoDetail});
});

export const markAsCompleted = CatchAsyncError(async (req : Request, res : Response) => {
    const { courseId, videoId } = req.params as CourseAndVideoId;
    const { state } = req.body as {state : boolean};
    const currentStudentId : string = req.student!.id;

    const videoCompleteStateDetail : SelectVideoCompletion = await markAsCompletedService(videoId, courseId, currentStudentId, state);
    res.status(200).json({success : true, videoCompleteStateDetail});
});

export const courseStateDetail = CatchAsyncError(async (req : Request, res : Response) => {
    const { courseId } = req.params as CourseParams;
    const { plan, id } = req.student!;

    const courseStateDetail : CourseStateResult = await courseStateDetailService(courseId, {plan, id});
    res.status(200).json({success : true, ...courseStateDetail});
});

export const courses = CatchAsyncError(async (req : Request, res : Response) => {
    const { startIndex, limit } = req.query as PaginationQuery;
    const courses : TSelectCourse[] = await coursesService(+limit, +startIndex);
    res.status(200).json({success : true, courses});
});

export const mostUsedTags = CatchAsyncError(async (req : Request, res : Response) => {
    const tags : TSelectTags[] = await mostUsedTagsService();
    res.status(200).json({success : true, tags});
});

export const filterCourseByTags = CatchAsyncError(async (req : Request, res : Response) => {
    const { tags } = req.body as {tags : string[]};
    const similarCourse : TSelectCourse[] = await filterCourseByTagsService(tags);
    res.status(200).json({success : true, similarCourse});
});

export const vectorSearch = CatchAsyncError(async (req : Request, res : Response) => {
    const { query } = req.body as {query : string};
    const similarCourse : Omit<VectorSeed, 'visibility'>[] = await vectorSearchService(query);
    res.status(200).json({success : true, similarCourse});
});