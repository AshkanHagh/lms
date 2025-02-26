import { and, eq, inArray } from "drizzle-orm";
import type {
  ChapterAndVideoDetails,
  ChapterDetails,
  CoursePurchase,
  CourseRelations,
  InsectCourseDetails,
  InsertVideoDetails,
  ModifiedChapterDetail,
  PurchasedCoursesWithRelations,
  SelectVideoCompletion,
  TSelectChapter,
  TSelectCourse,
  TSelectCourseBenefit,
  TSelectTags,
  TSelectVideoDetails,
  VectorSeed,
} from "../../types/index.type";
import { db } from "..";
import {
  chapterVideosTable,
  completeState,
  courseBenefitTable,
  courseChaptersTable,
  courseTable,
  courseTagsTable,
} from "../schema";
import { ResourceNotFoundError } from "../../libs/utils";
import { getHashCache } from "../cache/index.cache";

export const insertCourse = async (
  details: Pick<InsectCourseDetails, "title" | "teacherId">,
): Promise<TSelectCourse> => {
  return (await db.insert(courseTable).values(details).returning())[0];
};

export const insertCourseBenefit = async (
  benefit: Omit<TSelectCourseBenefit, "id">[],
): Promise<TSelectCourseBenefit[]> => {
  return await db.insert(courseBenefitTable).values(benefit).returning();
};

export const updateCourse = async (
  courseDetails: Partial<InsectCourseDetails>,
  courseId: string,
): Promise<TSelectCourse> => {
  return (
    await db
      .update(courseTable)
      .set(courseDetails)
      .where(eq(courseTable.id, courseId))
      .returning()
  )[0];
};

export const insertChapter = async (
  chapterDetail: ModifiedChapterDetail,
  trx = db,
): Promise<TSelectChapter> => {
  return (
    await trx.insert(courseChaptersTable).values(chapterDetail).returning()
  )[0];
};

export const insertChapterVideos = async (
  videosDetail: Omit<TSelectVideoDetails, "id">[],
  trx = db,
): Promise<TSelectVideoDetails[]> => {
  return await trx.insert(chapterVideosTable).values(videosDetail).returning();
};

export const updateChapterVideos = async (
  videoDetail: InsertVideoDetails,
  videoId: string,
): Promise<TSelectVideoDetails> => {
  return (
    await db
      .update(chapterVideosTable)
      .set(videoDetail)
      .where(eq(chapterVideosTable.id, videoId))
      .returning()
  )[0];
};

export const insertChapterAndVideos = async (
  chapterDetail: ModifiedChapterDetail,
  videosDetail: Omit<TSelectVideoDetails, "id">[],
): Promise<ChapterAndVideoDetails> => {
  const chapter_video_details = await db.transaction(async (trx) => {
    const newChapter: TSelectChapter = await insertChapter(chapterDetail, trx);
    videosDetail.map((videoDetail) => (videoDetail.chapterId = newChapter.id));

    const newVideos = await insertChapterVideos(videosDetail, trx);

    return {
      chapterDetails: newChapter,
      videoDetail: newVideos,
    } as ChapterAndVideoDetails;
  });
  return chapter_video_details;
};

export const findSimilarTags = async (
  courseId: string,
): Promise<TSelectTags[]> => {
  return await db.query.courseTagsTable.findMany({
    where: (table, funcs) => funcs.eq(table.courseId, courseId),
  });
};

export const insertNewTags = async (
  tags: Pick<TSelectTags, "tags" | "courseId">[],
): Promise<TSelectTags[]> => {
  return await db.insert(courseTagsTable).values(tags).returning();
};

export const removeTags = async (tagsId: string[]): Promise<void> => {
  await db.delete(courseTagsTable).where(inArray(courseTagsTable.id, tagsId));
};

export const updateTags = async (
  tagsId: string,
  newTags: string,
): Promise<void> => {
  await db
    .update(courseTagsTable)
    .set({ tags: newTags })
    .where(eq(courseTagsTable.id, tagsId));
};

export const findCourseWithRelations = async (
  courseId: string,
): Promise<CourseRelations> => {
  return await db.query.courseTable.findFirst({
    where: (table, funcs) => funcs.eq(table.id, courseId),
    with: {
      benefits: true,
      chapters: { with: { videos: true } },
      tags: true,
      purchases: { columns: { studentId: true } },
      teacher: { columns: { email: true, id: true, image: true, name: true } },
    },
  });
};

export const patchCourseChapter = async (
  chapterId: string,
  chapterDetails: Partial<ModifiedChapterDetail>,
): Promise<TSelectChapter> => {
  return (
    await db
      .update(courseChaptersTable)
      .set(chapterDetails)
      .where(eq(courseChaptersTable.id, chapterId))
      .returning()
  )[0];
};

export const findChapterDetail = async (
  chapterId: string,
): Promise<ChapterDetails | undefined> => {
  return await db.query.courseChaptersTable.findFirst({
    where: (table, funcs) => funcs.eq(table.id, chapterId),
    with: { videos: true },
  });
};

export const findCoursePurchases = async (
  courseId: string,
): Promise<CoursePurchase | undefined> => {
  return await db.query.courseTable.findFirst({
    where: (table, funcs) => funcs.eq(table.id, courseId),
    with: { purchases: true },
    columns: {},
  });
};

export const findPurchasedCourse = async (
  currentStudentId: string,
): Promise<PurchasedCoursesWithRelations[]> => {
  return await db.query.purchaseCoursesTable.findMany({
    where: (table, funcs) => funcs.eq(table.studentId, currentStudentId),
    columns: {},
    with: {
      course: { with: { chapters: { with: { videos: true }, columns: {} } } },
    },
  });
};

export const findVideoDetails = async (
  videoId: string,
): Promise<TSelectVideoDetails> => {
  const videoDetail: TSelectVideoDetails | undefined =
    await db.query.chapterVideosTable.findFirst({
      where: (table, funcs) => funcs.eq(table.id, videoId),
    });
  if (!videoDetail) throw new ResourceNotFoundError();
  return videoDetail;
};

export const findAllVideosDetail = async (
  chapterIds: string[],
): Promise<TSelectVideoDetails[]> => {
  const videoDetail: TSelectVideoDetails[] =
    await db.query.chapterVideosTable.findMany({
      where: (table, funcs) => funcs.inArray(table.chapterId, chapterIds),
    });
  return videoDetail;
};

export const handelVideoCompletion = async (
  courseId: string,
  videoId: string,
  currentStudentId: string,
  state: boolean,
): Promise<SelectVideoCompletion> => {
  const currentStudentVideoState: string = await getHashCache<string>(
    `student_state:${currentStudentId}:course:${courseId}`,
    videoId,
  );
  const insertNewCompletionDetail = async (
    courseId: string,
    videoId: string,
    currentStudentId: string,
  ): Promise<SelectVideoCompletion> => {
    return (
      await db
        .insert(completeState)
        .values({
          videoId,
          courseId,
          studentId: currentStudentId,
          completed: true,
        })
        .returning()
    )[0];
  };
  const updateCompletionState = async (
    videoId: string,
    currentStudentId: string,
    state: boolean,
  ): Promise<SelectVideoCompletion> => {
    return (
      await db
        .update(completeState)
        .set({ completed: state })
        .where(
          and(
            eq(completeState.studentId, currentStudentId),
            eq(completeState.videoId, videoId),
          ),
        )
        .returning()
    )[0];
  };

  if (!currentStudentVideoState || currentStudentVideoState.length === 0) {
    return await insertNewCompletionDetail(courseId, videoId, currentStudentId);
  }
  return await updateCompletionState(videoId, currentStudentId, state);
};

export const findCourseState = async (
  courseId: string,
  currentStudentId: string,
): Promise<SelectVideoCompletion[]> => {
  return await db.query.completeState.findMany({
    where: (table, { eq, and }) =>
      and(eq(table.studentId, currentStudentId), eq(table.courseId, courseId)),
  });
};

export const findManyCourse = async (
  limit: number | undefined,
  startIndex: number | undefined,
): Promise<TSelectCourse[]> => {
  return await db.query.courseTable.findMany({
    limit,
    offset: startIndex,
    orderBy: (table, funcs) => funcs.desc(table.createdAt),
  });
};

export const findModifiedCourse = async (
  courseId: string,
): Promise<VectorSeed | undefined> => {
  return await db.query.courseTable.findFirst({
    where: (table, { eq }) => eq(table.id, courseId),
    columns: {
      visibility: true,
      title: true,
      description: true,
      id: true,
      image: true,
      price: true,
    },
  });
};

export const findTeacherCourses = async (
  currentTeacherId: string,
): Promise<Pick<TSelectCourse, "id" | "title" | "price" | "visibility">[]> => {
  return await db
    .select({
      id: courseTable.id,
      title: courseTable.title,
      price: courseTable.price,
      visibility: courseTable.visibility,
    })
    .from(courseTable)
    .where(eq(courseTable.teacherId, currentTeacherId));
};
