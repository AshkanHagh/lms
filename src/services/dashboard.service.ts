import {
  getAllHashCache,
  insertHashCache,
} from "../database/cache/index.cache";
import { findStudentStates } from "../database/cache/student.cache";
import {
  findPurchasedCourse,
  findTeacherCourses,
} from "../database/queries/course.query";
import {
  countCoursePurchases,
  updateInformation,
} from "../database/queries/student.query";
import ErrorHandler from "../libs/utils/errorHandler";
import type {
  AnalyticsPurchase,
  CoursesProgress,
  ModifiedRelationsCourse,
  PurchaseDetailRes,
  SelectVideoCompletion,
  TErrorHandler,
  TransactionResult,
  TSelectCourse,
  TSelectPurchases,
  TSelectStudent,
  TSelectSubscription,
  TSelectVideoDetails,
  UpdateAccount,
} from "../types/index.type";

export const updatePersonalInformationService = async (
  currentUser: TSelectStudent,
  names: UpdateAccount,
) => {
  try {
    names.firstName = names.firstName ?? currentUser.name?.split(" ")[0];
    names.lastName = names.lastName ?? currentUser.name?.split(" ")[1];
    const fullName: string = `${names.firstName} ${names.lastName}`;

    const updatedName = await updateInformation(fullName, currentUser.id);
    await insertHashCache(`user:${currentUser.id}`, updatedName);

    return {
      firstName: updatedName.name?.split(" ")[0],
      lastName: updatedName.name?.split(" ")[1],
    };
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const transactionsListService = async (
  currentStudentId: string,
): Promise<TransactionResult> => {
  try {
    const purchaseList: Record<string, string> = await getAllHashCache(
      `student_purchases:${currentStudentId}`,
    );

    const purchaseDetail = Object.values(purchaseList).map(
      (purchase) => JSON.parse(purchase) as TSelectPurchases,
    );
    const subscriptionDetail: TSelectSubscription = await getAllHashCache(
      `student_subscription:${currentStudentId}`,
    );

    const modifiedPurchase: PurchaseDetailRes[] = await Promise.all(
      purchaseDetail.map(async (purchase) => {
        const { price, title, id }: TSelectCourse = await getAllHashCache(
          `course:${purchase.courseId}`,
        );
        const { courseId, ...modifiedPurchase } = purchase;
        return { ...modifiedPurchase, course: { price, title, id } };
      }),
    );

    return { modifiedPurchase, subscriptionDetail };
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const browseCoursesService = async (
  currentStudentId: string,
): Promise<CoursesProgress[]> => {
  try {
    const purchasedCourses = await findPurchasedCourse(currentStudentId);
    const modifiedCourse = purchasedCourses.map((obj) => ({
      ...obj.course,
      chapters: obj.course!.chapters.map((video) => video.videos).flat(),
    })) as ModifiedRelationsCourse[];

    const studentStateCache: Record<string, string>[] = await findStudentStates(
      currentStudentId,
      modifiedCourse.map((course) => course?.id || ""),
    );
    const studentStateDetail = studentStateCache
      // eslint-disable-next-line
      .map((state) => Object.values(state).map((state) => JSON.parse(state)))
      .flat() as SelectVideoCompletion[];

    const coursesProgress: CoursesProgress[] = modifiedCourse.map((course) => {
      const courseVideos: TSelectVideoDetails[] = course.chapters || [];
      const totalVideos: number = courseVideos.length;

      const completedVideos = courseVideos.filter((video) =>
        studentStateDetail.some(
          (state) => state.videoId === video.id && state.completed,
        ),
      );

      const completedVideosCount: number = completedVideos.length;
      const progressPercentage: number =
        totalVideos > 0
          ? Math.round((completedVideosCount / totalVideos) * 100)
          : 0;

      const { chapters, ...rest } = course;
      return { ...rest, progress: progressPercentage };
    });

    return coursesProgress;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const courseAnalysisService = async (
  currentTeacherId: string,
): Promise<AnalyticsPurchase[]> => {
  try {
    return await countCoursePurchases(currentTeacherId);
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};
// 1. I think it's best not to use cache here, cache response time was 1003ms and database hit 301.
export const teacherCoursesService = async (
  currentTeacherId: string,
): Promise<Pick<TSelectCourse, "id" | "title" | "price" | "visibility">[]> => {
  try {
    // const teacherCoursesCache : Pick<TSelectCourse, 'id' | 'title' | 'price' | 'visibility'>[] =
    // await findTeacherCoursesCache(currentTeacherId);
    // return teacherCoursesCache.length > 0 ? teacherCoursesCache : await findTeacherCourses(currentTeacherId)
    return await findTeacherCourses(currentTeacherId);
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};
