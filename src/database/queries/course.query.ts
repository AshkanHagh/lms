import { eq, inArray } from 'drizzle-orm';
import type { ChapterAndVideoDetails, CourseRelations, InsectCourseDetails, InsertVideoDetails, ModifiedChapterDetail, TSelectChapter, TSelectCourse, TSelectCourseBenefit, 
    TSelectTags, TSelectVideoDetails } from '../../types/index.type';
import { db } from '..';
import { chapterVideosTable, courseBenefitTable, courseChaptersTable, courseTable, courseTagsTable } from '../schema';

export const insertCourse = async (details : Pick<InsectCourseDetails, 'title' | 'teacherId'>) : Promise<TSelectCourse> => {
    const [courseDetail] = await db.insert(courseTable).values(details).returning();
    return courseDetail
}

export const insertCourseBenefit = async (benefit : Omit<TSelectCourseBenefit, 'id'>[]) : Promise<TSelectCourseBenefit[]> => {
    return await db.insert(courseBenefitTable).values(benefit).returning();
}

export const updateCourse = async (courseDetails : Partial<InsectCourseDetails>, courseId : string) : Promise<TSelectCourse> => {
    const updatedDetails : TSelectCourse[] = await db.update(courseTable).set(courseDetails).where(eq(courseTable.id, courseId)).returning();
    return updatedDetails[0]
}

export const insertChapter = async (chapterDetail : ModifiedChapterDetail, trx = db) : Promise<TSelectChapter> => {
    const [newChapter] : TSelectChapter[] = await trx.insert(courseChaptersTable).values(chapterDetail).returning();
    return newChapter;
}

export const insertChapterVideos = async (videosDetail : Omit<TSelectVideoDetails, 'id'>[], trx = db) : Promise<TSelectVideoDetails[]> => {
    const newVideos : TSelectVideoDetails[] = await trx.insert(chapterVideosTable).values(videosDetail).returning();
    return newVideos;
}

export const updateChapterVideos = async (videoDetail : InsertVideoDetails, videoId : string) : Promise<TSelectVideoDetails> => {
    const [updatedVideo] : TSelectVideoDetails[] = await db.update(chapterVideosTable).set(videoDetail)
    .where(eq(chapterVideosTable.id, videoId)).returning();
    return updatedVideo
}

export const insertChapterAndVideos = async (chapterDetail : ModifiedChapterDetail, videosDetail : Omit<TSelectVideoDetails, 'id'>[]) : 
Promise<ChapterAndVideoDetails> => {
    const chapter_video_details = await db.transaction(async trx => {
        const newChapter : TSelectChapter = await insertChapter(chapterDetail, trx);
        videosDetail.map(videoDetail => videoDetail.chapterId = newChapter.id);
        
        const newVideos : TSelectVideoDetails[] = await insertChapterVideos(videosDetail, trx);
        return { chapterDetails : newChapter, videoDetail : newVideos } as ChapterAndVideoDetails
    });
    return chapter_video_details;
}

export const findSimilarTags = async (courseId : string) : Promise<TSelectTags[]> => {
    return await db.query.courseTagsTable.findMany({where : (table, funcs) => funcs.eq(table.courseId, courseId)});
}

export const insertNewTags = async (tags : Pick<TSelectTags, 'tags' | 'courseId'>[]) : Promise<TSelectTags[]> => {
    return await db.insert(courseTagsTable).values(tags).returning();
}

export const removeTags = async (tagsId : string[]) : Promise<void> => {
    await db.delete(courseTagsTable).where(inArray(courseTagsTable.id, tagsId));
}

export const updateTags = async (tagsId : string, newTags : string) : Promise<void> => {
    await db.update(courseTagsTable).set({tags : newTags}).where(eq(courseTagsTable.id, tagsId));
}

export const findCourseWithRelations = async (courseId : string) : Promise<CourseRelations> => {
    const desiredCourse : CourseRelations = await db.query.courseTable.findFirst({
        where : (table, funcs) => funcs.eq(table.id, courseId),
        with : {benefits : true, chapters : {with : {videos : true}}, tags : true, teacher : true, purchases : {columns : {studentId : true}}}
    });
    return desiredCourse;
}

export const patchCourseChapter = async (chapterId : string, chapterDetails : Partial<ModifiedChapterDetail>) : Promise<TSelectChapter> => {
    const [updatedChapter] : TSelectChapter[] = await db.update(courseChaptersTable).set(chapterDetails)
    .where(eq(courseChaptersTable.id, chapterId)).returning();
    return updatedChapter
}