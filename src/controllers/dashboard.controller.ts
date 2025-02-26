import type { Request, Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import type {
  AnalyticsPurchase,
  CoursesProgress,
  TransactionResult,
  TSelectCourse,
  TSelectStudent,
  UpdateAccount,
} from "../types/index.type";
import {
  browseCoursesService,
  courseAnalysisService,
  teacherCoursesService,
  transactionsListService,
  updatePersonalInformationService,
} from "../services/dashboard.service";

export const updatePersonalInformation = CatchAsyncError(
  async (req: Request, res: Response) => {
    const { firstName, lastName } = req.body as UpdateAccount;
    const student: TSelectStudent = req.student!;

    const result = await updatePersonalInformationService(student, {
      firstName,
      lastName,
    });

    res.status(200).json({
      success: true,
      firstName: result.firstName,
      lastName: result.lastName,
    });
  },
);

export const transactionsList = CatchAsyncError(
  async (req: Request, res: Response) => {
    const currentStudentId: string = req.student!.id;
    const result = await transactionsListService(currentStudentId);

    res.status(200).json({
      success: true,
      transactions: result.modifiedPurchase,
      subscription: result.subscriptionDetail,
    });
  },
);

export const browseCourses = CatchAsyncError(
  async (req: Request, res: Response) => {
    const currentStudentId: string = req.student!.id;
    const courses = await browseCoursesService(currentStudentId);

    res.status(200).json({ success: true, courses });
  },
);

export const courseAnalysis = CatchAsyncError(
  async (req: Request, res: Response) => {
    const currentTeacherId: string = req.student!.id;
    const analytics = await courseAnalysisService(currentTeacherId);

    res.status(200).json({ success: true, analytics });
  },
);

export const teacherCourses = CatchAsyncError(
  async (req: Request, res: Response) => {
    const currentTeacherId: string = req.student!.id;
    const teacherCourses = await teacherCoursesService(currentTeacherId);

    res.status(200).json({ success: true, teacherCourses });
  },
);
