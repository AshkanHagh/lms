import type { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import type {
  CommentAuthorDetail,
  CourseAndCommentId,
  CourseParams,
  ModifiedCommentResult,
  ModifiedSendReplay,
  PaginationQuery,
  ReplayAndCommentId,
  TSelectComment,
  TSelectRate,
  TSelectReplay,
} from "../types/index.type";
import {
  courseCommentsService,
  courseRateDetailService,
  deleteCommentService,
  rateCourseService,
  removeReplayService,
  repliesDetailService,
  sendCommentService,
  sendReplayService,
  updateCommentService,
  updateReplayService,
} from "../services/comment.service";

// subscripted student can comment and replay
export const rateCourse = CatchAsyncError(
  async (req: Request, res: Response) => {
    const currentStudentId: string = req.student!.id;
    const { courseId } = req.params as CourseParams;

    const { rate } = req.body as Pick<TSelectRate, "rate">;

    const rateDetail: TSelectRate = await rateCourseService(
      currentStudentId,
      courseId,
      rate!,
    );
    res.status(200).json({ success: true, rateDetail });
  },
);

export const courseRateDetail = CatchAsyncError(
  async (req: Request, res: Response) => {
    const { courseId } = req.params as CourseParams;
    const averageRate: number = await courseRateDetailService(courseId);
    res.status(200).json({ success: true, averageRate });
  },
);

export const sendComment = CatchAsyncError(
  async (req: Request, res: Response) => {
    const { courseId } = req.params as CourseParams;
    const { text } = req.body as Pick<TSelectComment, "text">;
    const { id, image, name, role }: CommentAuthorDetail = req.student!;

    const commentDetail: ModifiedCommentResult = await sendCommentService(
      { id, image, name, role },
      courseId,
      text,
    );
    res.status(200).json({ success: true, commentDetail });
  },
);

export const updateComment = CatchAsyncError(
  async (req: Request, res: Response) => {
    const { courseId, commentId } = req.params as CourseAndCommentId;
    const { text } = req.body as Pick<TSelectComment, "text">;
    const studentId: string = req.student!.id;

    const updatedComment: TSelectComment = await updateCommentService(
      studentId,
      courseId,
      commentId,
      text,
    );
    res.status(200).json({ success: true, updatedComment });
  },
);

export const deleteComment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const { courseId, commentId } = req.params as CourseAndCommentId;
    const studentId: string = req.student!.id;

    const message: string = await deleteCommentService(
      studentId,
      courseId,
      commentId,
    );
    res.status(200).json({ success: true, message });
  },
);

export const courseComments = CatchAsyncError(
  async (req: Request, res: Response) => {
    const { courseId } = req.params as CourseParams;
    const { limit, startIndex } = req.query as PaginationQuery;
    const commentsDetails: ModifiedCommentResult[] =
      await courseCommentsService(courseId, +limit, +startIndex);
    res.status(200).json({ success: true, commentsDetails });
  },
);

export const sendReplay = CatchAsyncError(
  async (req: Request, res: Response) => {
    const { courseId, commentId } = req.params as CourseAndCommentId;
    const { text } = req.body as Pick<TSelectReplay, "text">;
    const { id, image, name, role }: CommentAuthorDetail = req.student!;

    const replayDetail: ModifiedSendReplay = await sendReplayService(
      { id, image, name, role },
      courseId,
      commentId,
      text,
    );
    res.status(200).json({ success: true, replayDetail });
  },
);

export const updateReplay = CatchAsyncError(
  async (req: Request, res: Response) => {
    const { replayId, commentId } = req.params as ReplayAndCommentId;
    const { text } = req.body as Pick<TSelectReplay, "text">;
    const { id, image, name, role }: CommentAuthorDetail = req.student!;

    const replayDetail: ModifiedSendReplay = await updateReplayService(
      { id, image, name, role },
      commentId,
      replayId,
      text,
    );
    res.status(200).json({ success: true, replayDetail });
  },
);

export const removeReplay = CatchAsyncError(
  async (req: Request, res: Response) => {
    const { replayId, commentId } = req.params as ReplayAndCommentId;
    const studentId: string = req.student!.id;

    const message: string = await removeReplayService(
      studentId,
      commentId,
      replayId,
    );
    res.status(200).json({ success: true, message });
  },
);

export const repliesDetail = CatchAsyncError(
  async (req: Request, res: Response) => {
    const { commentId } = req.params as ReplayAndCommentId;
    const { limit, startIndex } = req.query as PaginationQuery;

    const repliesDetail = await repliesDetailService(
      commentId,
      +limit,
      +startIndex,
    );
    res.status(200).json({ success: true, repliesDetail });
  },
);
