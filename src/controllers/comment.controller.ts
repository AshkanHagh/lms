import type { NextFunction, Request, Response } from 'express';
import { CatchAsyncError } from '../middlewares/catchAsyncError';
import type { CourseAndCommentId, CourseParams, ModifiedCommentResult, PaginationQuery, TSelectComment, TSelectRate } from '../types/index.type';
import { courseCommentsService, courseRateDetailService, deleteCommentService, rateCourseService, sendCommentService, 
    updateCommentService 
} from '../services/comment.service';

export const rateCourse = CatchAsyncError(async (req : Request, res : Response) => {
    const currentStudentId : string = req.student!.id;
    const { courseId } = req.params as CourseParams;
    const { rate } = req.body as Pick<TSelectRate, 'rate'>;

    const rateDetail : TSelectRate = await rateCourseService(currentStudentId, courseId, rate!);
    res.status(200).json({success : true, rateDetail});
});

export const courseRateDetail = CatchAsyncError(async (req : Request, res : Response) => {
    const { courseId } = req.params as CourseParams;
    const averageRate : number = await courseRateDetailService(courseId);
    res.status(200).json({success : true, averageRate});
});

export const sendComment = CatchAsyncError(async (req : Request, res : Response) => {
    const { courseId } = req.params as CourseParams;
    const { text } = req.body as Pick<TSelectComment, 'text'>;
    const currentStudentId : string = req.student!.id;

    const commentDetail : ModifiedCommentResult = await sendCommentService(currentStudentId, courseId, text);
    res.status(200).json({success : true, commentDetail});
});

export const updateComment = CatchAsyncError(async (req : Request, res : Response) => {
    const { courseId, commentId } = req.params as CourseAndCommentId;
    const { text } = req.body as Pick<TSelectComment, 'text'>;
    const studentId : string = req.student!.id;

    const updatedComment : TSelectComment = await updateCommentService(studentId, courseId, commentId, text);
    res.status(200).json({success : true, updatedComment});
});

export const deleteComment = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    const { courseId, commentId } = req.params as CourseAndCommentId;
    const studentId : string = req.student!.id;

    const message : string = await deleteCommentService(studentId, courseId, commentId);
    res.status(200).json({success : true, message});
});

export const courseComments = CatchAsyncError(async (req : Request, res : Response) => {
    const { courseId } = req.params as CourseParams;
    const { limit, startIndex } = req.query as PaginationQuery; 
    const commentsDetails : ModifiedCommentResult[] = await courseCommentsService(courseId, +limit, +startIndex);
    res.status(200).json({success : true, commentsDetails});
});