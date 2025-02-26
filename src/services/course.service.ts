import {
  findManyCache,
  findAllCourseChapter,
  findCourseWithChapterId,
  filterCourseByTagsCache,
} from "../database/cache/course.cache";
import {
  getAllHashCache,
  getHashCache,
  getSetListCache,
  insertHashCache,
  insertHashListCache,
  insertSetListCache,
  removeFromHashListCache,
} from "../database/cache/index.cache";
import {
  findChapterDetail,
  findCoursePurchases,
  findCourseWithRelations,
  findSimilarTags,
  findVideoDetails,
  updateTags,
  insertCourseBenefit,
  insertNewTags,
  patchCourseChapter,
  removeTags,
  updateChapterVideos,
  updateCourse,
  insertCourse,
  insertChapterAndVideos,
  handelVideoCompletion,
  findCourseState,
  findAllVideosDetail,
  findManyCourse,
} from "../database/queries/course.query";
import {
  NeedToPurchaseThisCourseError,
  ResourceNotFoundError,
} from "../libs/utils";
import ErrorHandler from "../libs/utils/errorHandler";
import type {
  ChapterAndVideoDetails,
  courseBenefitAndDetails,
  CourseGeneric,
  CourseRelations,
  FilteredChapters,
  InsectCourseDetailsBody,
  ModifiedChapterDetail,
  Entries,
  TErrorHandler,
  TSelectCourse,
  TSelectCourseBenefit,
  TSelectTags,
  TSelectVideoDetails,
  uploadVideoDetailResponse,
  TSelectChapter,
  InsertVideoDetails,
  TSelectStudent,
  ChapterDetails,
  CoursePurchase,
  ModifiedPurchase,
  SelectVideoCompletion,
  CourseStateResult,
  MostUsedTagsMap,
  VectorSeed,
  VectorResult,
} from "../types/index.type";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import pLimit from "p-limit";
import crypto from "crypto";
import { findPurchase } from "../database/queries/checkout.query";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import type { Document } from "langchain/document";
import { vectorRedis } from "../database/cache/redis.config";
import { courseEvent } from "../events/course.event";

const semanticSplitter: RecursiveCharacterTextSplitter =
  new RecursiveCharacterTextSplitter({
    chunkSize: 25,
    separators: [" "],
    chunkOverlap: 8,
  });

export const createCourseService = async <T extends CourseGeneric<"insert">>(
  courseDetail: InsectCourseDetailsBody<T>,
): Promise<TSelectCourse> => {
  try {
    const courseDetails: TSelectCourse = await insertCourse(courseDetail);
    await insertHashCache(`course:${courseDetails.id}`, courseDetails);
    return courseDetails;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const editCourseDetailsService = async <
  B extends CourseGeneric<"update">,
>(
  courseDetail: Partial<InsectCourseDetailsBody<B>>,
  courseId: string,
  tags: string[],
  courseCache: TSelectCourse,
): Promise<TSelectCourse> => {
  try {
    let currentTags: TSelectTags[];
    const currentTagsData: Record<string, string> = await getAllHashCache<
      Record<string, string>
    >(`course_tags:${courseId}`);
    const newTagsSet: Set<string> = new Set(tags);

    const entries: Entries[] = Object.entries(currentTagsData).map(
      ([key, value]) => ({ key, value }),
    );
    currentTags = entries.map((entry) =>
      JSON.parse(entry.value),
    ) as TSelectTags[];
    if (Object.keys(currentTagsData).length === 0)
      currentTags = (await findSimilarTags(courseId)) as TSelectTags[];

    const existingTagsSet: Set<string | never[]> = new Set(
      currentTags.map((tag) => tag.tags),
    );
    const tagsToAdd: string[] = tags.filter((tag) => !existingTagsSet.has(tag));
    const removedTags: TSelectTags[] = currentTags.filter(
      (tagObj) => !newTagsSet.has(tagObj.tags),
    );
    const updatedTags: TSelectTags[] = currentTags.filter(
      (tagObj) => newTagsSet.has(tagObj.tags) && !tags.includes(tagObj.tags),
    );

    await handleTags(tagsToAdd, removedTags, updatedTags, courseId);
    const uploadedImageUrl: string | undefined = await handleImageUpload(
      courseDetail.image ?? undefined,
      courseCache.image ?? null,
    );

    const updatedDetails: TSelectCourse = await updateCourse(
      {
        ...courseDetail,
        image: uploadedImageUrl,
        prerequisite: courseDetail.prerequisite?.join(" "),
      },
      courseId,
    );
    await insertHashCache(`course:${courseId}`, updatedDetails);
    courseEvent.emit("seed_vector_one", courseId);
    return updatedDetails;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const combineTagAndCourseId = (
  tags: string[],
  courseId: string,
): Omit<TSelectTags, "id">[] => {
  return tags.map((tag) => ({ tags: tag, courseId }));
};

export const handleTags = async (
  tagsToAdd: string[],
  removedTags: TSelectTags[],
  updatedTags: TSelectTags[],
  courseId: string,
): Promise<void> => {
  const operations = [
    () => insertNewTagsIfNeeded(tagsToAdd, courseId),
    () => removeTagsIfNeeded(removedTags, courseId),
    ...updatedTags.map((tag) => () => updateTags(tag.id, tag.tags)),
  ];
  await Promise.all(operations.map((operation) => operation()));
};

export const insertNewTagsIfNeeded = async (
  tagsToAdd: string[],
  courseId: string,
): Promise<void> => {
  if (tagsToAdd && tagsToAdd.length > 0) {
    const newTags: TSelectTags[] = await insertNewTags(
      combineTagAndCourseId(tagsToAdd, courseId),
    );
    newTags.map(
      async (tag) =>
        await insertHashListCache(`course_tags:${courseId}`, tag.id, tag),
    );
  }
};

const removeTagsIfNeeded = async (
  removedTags: TSelectTags[],
  courseId: string,
): Promise<void> => {
  if (removedTags.length > 0) {
    await removeTags(removedTags.map((tag) => tag.id));
    removedTags.map(
      async (tag) =>
        await removeFromHashListCache(`course_tags:${courseId}`, tag.id),
    );
  }
};
const handleImageUpload = async (
  newImage: string | undefined,
  currentImage: string | null,
): Promise<string | undefined> => {
  if (currentImage?.length && newImage?.length) {
    await cloudinary.uploader.destroy(
      currentImage.split("/").pop()!.split(".")[0],
    );
    const uploadResponse: UploadApiResponse | undefined = newImage
      ? await cloudinary.uploader.upload(newImage)
      : undefined;
    return uploadResponse?.secure_url || undefined;
  }
  const uploadedResponse: UploadApiResponse | undefined = newImage
    ? await cloudinary.uploader.upload(newImage)
    : undefined;
  return uploadedResponse?.secure_url || undefined;
};

export const courseBenefitService = async (
  benefits: Omit<TSelectCourseBenefit, "id">[],
  courseDetail: TSelectCourse,
): Promise<courseBenefitAndDetails> => {
  try {
    const benefitResult: TSelectCourseBenefit[] =
      await insertCourseBenefit(benefits);
    await Promise.all(
      benefitResult.map<void>(async (benefit) => {
        insertSetListCache(
          `course_benefits:${courseDetail.id}`,
          JSON.stringify(benefit),
        );
      }),
    );
    return { course: courseDetail, benefits: benefitResult };
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const createCourseChapterService = async (
  videoDetails: Omit<TSelectVideoDetails, "id">[],
  chapterDetail: ModifiedChapterDetail,
  courseId: string,
): Promise<ChapterAndVideoDetails> => {
  try {
    const uploadedResponse: uploadVideoDetailResponse[] =
      await uploadVideoDetails(videoDetails);
    const responseMap: Map<string, uploadVideoDetailResponse> = new Map(
      uploadedResponse.map((upload) => [upload.videoTitle, upload]),
    );

    videoDetails.forEach((video) => {
      const upload: uploadVideoDetailResponse | undefined = responseMap.get(
        video.videoTitle,
      );
      if (upload) video.videoUrl = upload.videoUploadResponse.secure_url;
    });

    const { chapterDetails, videoDetail } = await insertChapterAndVideos(
      { ...chapterDetail, courseId: courseId },
      videoDetails,
    );
    await insertHashCache(
      `course:${courseId}:chapters:${chapterDetails.id}`,
      chapterDetails,
    );
    await Promise.all(
      videoDetail.map(async (video) => {
        insertHashListCache(
          `course_videos:${video.chapterId}`,
          video.id,
          video,
        );
      }),
    );
    return {
      chapterDetails: chapterDetails,
      videoDetail,
    } as ChapterAndVideoDetails;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

const generateHash = (input: string): string => {
  return crypto.createHash("sha256").update(input).digest("hex");
};

export const updateCourseChapterService = async (
  chapterId: string,
  courseId: string,
  chapterDetails: Partial<ModifiedChapterDetail>,
): Promise<TSelectChapter> => {
  try {
    const existingChapterDetail: TSelectChapter | null =
      await findAllCourseChapter(`course:${courseId}:chapters:*`, chapterId);
    const changedValue = new Map<
      keyof Partial<ModifiedChapterDetail>,
      string | null
    >();

    Object.keys(chapterDetails).forEach((key) => {
      const detailKey = key as keyof Partial<ModifiedChapterDetail>;
      if (chapterDetails[detailKey] !== undefined) {
        const newValue: string | null = chapterDetails[detailKey] ?? null;
        const oldValue: string | null = existingChapterDetail
          ? existingChapterDetail[detailKey]
          : null;

        const newHash: string | null = newValue ? generateHash(newValue) : null;
        const oldHash: string | null = oldValue ? generateHash(oldValue) : null;
        if (newHash !== oldHash) changedValue.set(detailKey, newValue);
      }
    });
    const valuesToAdd: Partial<ModifiedChapterDetail> =
      Object.fromEntries(changedValue);

    if (Object.keys(valuesToAdd).length) {
      const updatedChapterDetail: TSelectChapter = await patchCourseChapter(
        chapterId,
        valuesToAdd,
      );
      await insertHashCache(
        `course:${courseId}:chapters:${chapterId}`,
        updatedChapterDetail,
      );
      return updatedChapterDetail;
    }
    return existingChapterDetail!;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const updateChapterVideoDetailService = async (
  chapterId: string,
  videoId: string,
  currentTeacherId: string,
  videoDetail: InsertVideoDetails,
): Promise<TSelectVideoDetails> => {
  try {
    const videoCache: TSelectVideoDetails = JSON.parse(
      await getHashCache(`course_videos:${chapterId}`, videoId),
    );
    if (!videoCache || Object.keys(videoCache).length === 0)
      throw new ResourceNotFoundError();
    await handleOldVideo(videoCache.videoUrl);

    const videoUploadResponse: uploadVideoDetailResponse[] =
      await uploadVideoDetails([videoDetail]);
    const updatedVideoDetail: TSelectVideoDetails = await updateChapterVideos(
      {
        ...videoDetail,
        videoUrl: videoUploadResponse[0].videoUploadResponse.secure_url,
      },
      videoId,
    );
    await insertHashListCache(
      `course_videos:${chapterId}`,
      videoId,
      updatedVideoDetail,
    );

    return updatedVideoDetail;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const handleOldVideo = async (videoUrl: string): Promise<void> => {
  await cloudinary.uploader.destroy(videoUrl.split("/").pop()!.split(".")[0], {
    resource_type: "video",
  });
};

const uploadVideoDetails = async <T extends InsertVideoDetails>(
  videoDetails: T[],
): Promise<uploadVideoDetailResponse[]> => {
  const limit = pLimit(10);
  const uploadResponse: Promise<uploadVideoDetailResponse>[] = videoDetails.map(
    (video) => {
      return limit(async () => {
        const videoUploadResponse: UploadApiResponse =
          await cloudinary.uploader.upload_large(video.videoUrl, {
            resource_type: "video",
          });
        return { videoTitle: video.videoTitle, videoUploadResponse };
      });
    },
  );
  const uploadedResponse: uploadVideoDetailResponse[] =
    await Promise.all(uploadResponse);
  return uploadedResponse;
};

export const courseService = async (
  currentStudent: TSelectStudent,
  courseId: string,
): Promise<CourseRelations> => {
  try {
    const courseDetail: CourseRelations =
      await findCourseWithRelations(courseId);
    if (courseDetail?.visibility !== "publish")
      throw new ResourceNotFoundError();

    const studentHasPurchased: boolean | undefined =
      courseDetail?.purchases?.some(
        (student) => student.studentId === currentStudent.id,
      );
    const studentHasSubscribed: boolean | undefined =
      currentStudent.plan?.includes("premium");
    const studentRole: boolean | undefined =
      currentStudent.role?.includes("teacher");

    const canAccessVideo = (video: TSelectVideoDetails): boolean =>
      studentRole ||
      studentHasPurchased ||
      studentHasSubscribed ||
      video.state === "free";

    const filteredChapters: FilteredChapters = courseDetail?.chapters
      ?.filter((chapter) => chapter.visibility !== "draft")
      .map((chapter) => ({
        ...chapter,
        videos: chapter.videos.filter(canAccessVideo),
      }));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { purchases, ...courseDetails } = courseDetail;
    const modifiedCourse: CourseRelations = {
      ...courseDetails,
      chapters: filteredChapters,
    } as CourseRelations;
    return modifiedCourse;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const courseChapterDetailsService = async (
  courseId: string,
  chapterId: string,
  currentStudent: Pick<TSelectStudent, "plan" | "id">,
): Promise<ChapterDetails> => {
  try {
    const purchaseDetail: number = await getSetListCache(
      `course_purchases:${courseId}`,
      currentStudent.id,
    );
    const [chapterDetailsCache, videoDetailsCache]: [
      ChapterDetails,
      Record<string, string>,
    ] = await Promise.all([
      getAllHashCache<ChapterDetails>(
        `course:${courseId}:chapters:${chapterId}`,
      ),
      getAllHashCache<Record<string, string>>(`course_videos:${chapterId}`),
    ]);
    const videoDetails: TSelectVideoDetails[] = Object.values(
      videoDetailsCache,
    ).map((videos) => JSON.parse(videos)) as TSelectVideoDetails[];

    let coursePurchase: CoursePurchase | undefined;
    if (!purchaseDetail)
      coursePurchase = (await findCoursePurchases(courseId)) as
        | CoursePurchase
        | undefined;

    const studentHasPurchased: number = coursePurchase
      ? coursePurchase.purchases.some(
          (student) => student.studentId === currentStudent.id,
        )
        ? 1
        : 0
      : purchaseDetail;

    const chapterDetails: ChapterDetails | undefined =
      Object.keys(chapterDetailsCache).length && videoDetails.length
        ? { ...chapterDetailsCache, videos: videoDetails }
        : await findChapterDetail(chapterId);
    if (!chapterDetails) throw new ResourceNotFoundError();

    const studentSubscription: boolean | undefined =
      currentStudent.plan?.includes("premium");
    const accessibleVideos: TSelectVideoDetails[] =
      studentHasPurchased || studentSubscription
        ? chapterDetails.videos
        : chapterDetails.videos.filter((video) => video.state === "free");

    return { ...chapterDetails, videos: accessibleVideos };
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const courseVideosDetailService = async (
  videoId: string,
  chapterId: string,
  currentStudentId: string,
): Promise<TSelectVideoDetails> => {
  try {
    const courseDetail: TSelectCourse | undefined =
      await findCourseWithChapterId(chapterId);
    const studentPurchaseDetail: ModifiedPurchase = await findPurchase(
      courseDetail!.id,
      currentStudentId,
      "modified",
    );
    if (!studentPurchaseDetail) throw new NeedToPurchaseThisCourseError();

    const videoDetail: TSelectVideoDetails = await findVideoDetails(videoId);
    return videoDetail;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const markAsCompletedService = async (
  videoId: string,
  courseId: string,
  currentStudentId: string,
  state: boolean,
): Promise<SelectVideoCompletion> => {
  try {
    const videoCompleteStateDetail: SelectVideoCompletion =
      await handelVideoCompletion(courseId, videoId, currentStudentId, state);
    await insertHashListCache(
      `student_state:${currentStudentId}:course:${courseId}`,
      videoId,
      videoCompleteStateDetail,
    );
    return videoCompleteStateDetail;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const courseStateDetailService = async (
  courseId: string,
  currentStudent: Pick<TSelectStudent, "id" | "plan">,
): Promise<CourseStateResult> => {
  try {
    const videosStateRecord: Record<string, string> = await getAllHashCache(
      `student_state:${currentStudent.id}:course:${courseId}`,
    );
    const videosStateDetail: SelectVideoCompletion[] = videosStateRecord
      ? (Object.values(videosStateRecord).map((video) =>
          JSON.parse(video),
        ) as SelectVideoCompletion[])
      : await findCourseState(courseId, currentStudent.id);

    const [coursePurchase, chapters]: [ModifiedPurchase, TSelectChapter[]] =
      await Promise.all([
        findPurchase(courseId, currentStudent.id, "modified"),
        findManyCache<TSelectChapter>(`course:${courseId}:chapters:*`),
      ]);
    const videos: TSelectVideoDetails[] = await findAllVideosDetail(
      chapters.map((chapter) => chapter.id),
    );

    const currentStudentPlan: boolean | undefined =
      currentStudent.plan?.includes("premium");
    if (!coursePurchase && !currentStudentPlan)
      throw new NeedToPurchaseThisCourseError();

    const completedVideos: Set<string | null> = new Set(
      videosStateDetail
        .filter((video) => video.completed)
        .map((video) => video.videoId),
    );
    const remainingVideos: TSelectVideoDetails[] = videos.filter(
      (video) => !completedVideos.has(video.id),
    );

    const totalVideos: number = videos.length;
    const completedVideosCount: number = completedVideos.size;
    return {
      remainingVideos,
      progressPercentage: Math.round(
        (completedVideosCount / totalVideos) * 100,
      ),
    };
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const coursesService = async (
  limit: number,
  startIndex: number,
): Promise<TSelectCourse[]> => {
  try {
    const coursesCache: TSelectCourse[] =
      await findManyCache<TSelectCourse>("course:*");
    if (coursesCache.length > 0) {
      const filteredAndSortedCourses: TSelectCourse[] = coursesCache
        .reduce((acc, course) => {
          if (
            course.id &&
            course.teacherId &&
            course.title &&
            course.description &&
            course.prerequisite &&
            course.price &&
            course.image &&
            course.visibility &&
            course.createdAt &&
            course.updatedAt
          ) {
            acc.push(course);
          }
          return acc;
        }, [] as TSelectCourse[])
        .sort(
          (a, b) =>
            new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime(),
        );

      return filteredAndSortedCourses.splice(startIndex, limit);
    }
    const courses: TSelectCourse[] = await findManyCourse(limit, startIndex);
    return courses;
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const mostUsedTagsService = async (): Promise<TSelectTags[]> => {
  try {
    const tagsRecord: Record<string, string>[] =
      await findManyCache("course_tags:*");
    const existingTags: TSelectTags[] = tagsRecord
      .map((tag) => Object.values(tag).map((tag) => JSON.parse(tag)))
      .flat();
    const tagsMap: Map<string, MostUsedTagsMap> = new Map<
      string,
      MostUsedTagsMap
    >();
    existingTags.forEach((tag) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      tagsMap.has(tag.tags)
        ? (tagsMap.get(tag.tags)!.count += 1)
        : tagsMap.set(tag.tags, { tag, count: 1 });
    });
    const mostUsedTags: MostUsedTagsMap[] = Array.from(tagsMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return mostUsedTags.map((tag) => tag.tag);
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

export const filterCourseByTagsService = async (
  tags: string[],
): Promise<TSelectCourse[]> => {
  try {
    return await filterCourseByTagsCache(tags);
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred : ${error.message}`,
      error.statusCode,
    );
  }
};

const splitTextIntoWords = (text: string): string[] => {
  return text.split(/\s/);
};

const splitTextIntoSemantic = async (text: string): Promise<string[]> => {
  if (text.split(/\s/).length === 0) return [];
  const documents: Document<Record<string, string>>[] =
    await semanticSplitter.createDocuments([text]);
  return documents.map((chunk) => chunk.pageContent);
};

export const vectorSearchService = async (
  query: string,
): Promise<Omit<VectorSeed, "visibility">[]> => {
  try {
    const [semanticChunks, wordChunks]: string[][] = await Promise.all([
      splitTextIntoSemantic(query),
      splitTextIntoWords(query),
    ]);

    const flaggedFor: VectorResult[] = [];
    await Promise.all([
      ...wordChunks.map(async (wordChunk) => {
        const vectors = await vectorRedis.query({
          topK: 12,
          data: wordChunk,
          includeMetadata: true,
        });
        vectors.forEach((vector) => {
          flaggedFor.push({
            score: vector.score,
            course: vector.metadata as VectorSeed,
          });
        });
      }),
      ...semanticChunks.map(async (semanticChunk) => {
        const vectors = await vectorRedis.query({
          topK: 12,
          data: semanticChunk,
          includeMetadata: true,
        });
        vectors.forEach((vector) => {
          flaggedFor.push({
            score: vector.score,
            course: vector.metadata as VectorSeed,
          });
        });
      }),
    ]);

    const uniqueVectorRes: VectorResult[] = Array.from(
      new Map(flaggedFor.map((obj) => [obj.course.id, obj])).values(),
    );
    const sortedVectorRes: VectorResult[] = uniqueVectorRes
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 8);
    return sortedVectorRes.map((obj) => obj.course);
  } catch (err: unknown) {
    const error = err as TErrorHandler;
    throw new ErrorHandler(
      `An error occurred: ${error.message}`,
      error.statusCode,
    );
  }
};
