import { eq, inArray } from 'drizzle-orm';
import type { ChapterAndVideoDetails, InsectCourseDetails, ModifiedChapterDetail, TSelectChapter, TSelectCourse, TSelectCourseBenefit, TSelectTags, TSelectVideoDetails } from '../../types/index.type';
import { db } from '../db';
import { chapterVideosTable, courseBenefitTable, courseChaptersTable, courseDetailTable, courseTable, courseTagsTable } from '../schema';

export const insertCourse = async (details : InsectCourseDetails) : Promise<TSelectCourse> => {
    const courseDetail : TSelectCourse[] = await db.transaction(async trx => {
        const courseDetail = await trx.insert(courseTable).values(details).returning();
        await trx.insert(courseDetailTable).values({courseId : courseDetail[0].id})
        return courseDetail
    });
    return courseDetail[0];
}

export const insertCourseBenefit = async (benefit : Omit<TSelectCourseBenefit, 'id'>[]) : Promise<TSelectCourseBenefit[]> => {
    return await db.insert(courseBenefitTable).values(benefit).returning();
}

export const updateCourse = async (course : Partial<InsectCourseDetails>, courseId : string) : Promise<TSelectCourse> => {
    const updatedDetails : TSelectCourse[] = await db.update(courseTable).set(course).where(eq(courseTable.id, courseId)).returning();
    return updatedDetails[0]
}

export const insertChapter = async (chapterDetail : ModifiedChapterDetail, trx = db) : Promise<TSelectChapter> => {
    const [newChapter] : TSelectChapter[] = await trx.insert(courseChaptersTable).values(chapterDetail).returning();
    return newChapter;
}

export const insertChapterVideos = async (videosDetail : TSelectVideoDetails[], trx = db) : Promise<TSelectVideoDetails[]> => {
    const newVideos : TSelectVideoDetails[] = await trx.insert(chapterVideosTable).values(videosDetail).returning();
    return newVideos;
}

export const insertChapterAndVideos = async (chapterDetail : ModifiedChapterDetail, videosDetail : TSelectVideoDetails[]) : 
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

export const insertNewTags = async (tags : Pick<TSelectTags, 'tags'>[]) : Promise<TSelectTags[]> => {
    return await db.insert(courseTagsTable).values(tags).returning();
}

export const removeTags = async (tagsId : string[]) : Promise<void> => {
    await db.delete(courseTagsTable).where(inArray(courseTagsTable.id, tagsId));
}

export const updateTags = async (tagsId : string, newTags : string) : Promise<void> => {
    await db.update(courseTagsTable).set({tags : newTags}).where(eq(courseTagsTable.id, tagsId));
}