import { and, desc, eq } from 'drizzle-orm';
import { db } from '../.';
import type { TSelectComment, TSelectRate } from '../../types/index.type';
import { commentTable, courseCommentsTable, courseRatingTable } from '../schema';
import { AlreadyRatedError } from '../../libs/utils';
import { getHashCache } from '../cache/index.cache';

export const handelRate = async (currentStudentId : string, courseId : string, rate : number) : Promise<TSelectRate> => {
    const existingRateCache : TSelectRate = JSON.parse(await getHashCache(`course_rate:${courseId}`, currentStudentId));

    const existingRate : TSelectRate = existingRateCache ? existingRateCache : await checkStudentRate(currentStudentId, courseId);
    if(existingRate.rate === rate) throw new AlreadyRatedError();

    const updateRate = async (currentStudentId : string, courseId : string, rate : number) : Promise<TSelectRate> => {
        return (await db.update(courseRatingTable).set({courseId, rate, studentId : currentStudentId})
            .where(and(eq(courseRatingTable.courseId, courseId), eq(courseRatingTable.studentId, currentStudentId))).returning()
        )[0];
    }
    const insertRate = async (currentStudentId : string, courseId : string, rate : number) : Promise<TSelectRate> => {
        return (await db.insert(courseRatingTable).values({courseId, rate, studentId : currentStudentId}).returning())[0];
    }

    if(existingRate) return await updateRate(currentStudentId, courseId, rate);
    return await insertRate(currentStudentId, courseId, rate);
};

export const findRatesDetail = async (courseId : string) : Promise<TSelectRate[]> => {
    return await db.select().from(courseRatingTable).where(eq(courseRatingTable.courseId, courseId));
};

export const checkStudentRate = async (currentStudentId : string, courseId : string) : Promise<TSelectRate> => {
    return (await db.select().from(courseRatingTable).where(and(
        eq(courseRatingTable.courseId, courseId), eq(courseRatingTable.studentId, currentStudentId)
    )))[0];
};

export const handelInsertComment = async (studentId : string, courseId : string, text : string) : Promise<TSelectComment> => {
    return await db.transaction(async trx => {
        const [commentDetail] : TSelectComment[] = await trx.insert(commentTable).values({authorId : studentId, text}).returning();
        await trx.insert(courseCommentsTable).values({commentId : commentDetail.id, courseId});
        return commentDetail
    });
}

export const updateCommentDetail = async (commentId : string, text : string) : Promise<TSelectComment> => {
    return (await db.update(commentTable).set({text}).where(eq(commentTable.id, commentId)).returning())[0];
}

export const removeComment = async (commentId : string) : Promise<void> => {
    await db.delete(commentTable).where(eq(commentTable.id, commentId));
}

export const courseCommentsDetail = async (courseId : string, limit : number, startIndex : number) : Promise<TSelectComment[]> => {
    const courseCommentsDetail : {comment : TSelectComment | null}[] = await db.select({
        comment : commentTable
    }).from(courseCommentsTable)
    .leftJoin(commentTable, eq(commentTable.id, courseCommentsTable.commentId))
    .where(eq(courseCommentsTable.courseId, courseId)).limit(limit).offset(startIndex).orderBy(desc(commentTable.createdAt));

    return courseCommentsDetail.reduce((acc, comment) => {
        if(comment.comment) acc.push(comment.comment)
        return acc
    }, [] as TSelectComment[]);
}