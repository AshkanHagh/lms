import { getAllHashCache, getHashCache, getSetListCache, insertHashListCache, removeFromHashListCache } from '../database/cache/index.cache';
import { findCommentAuthor } from '../database/cache/student.cache';
import { findPurchase } from '../database/queries/checkout.query';
import { courseCommentsDetail, findRatesDetail, handelInsertComment, handelRate, removeComment, 
    updateCommentDetail } from '../database/queries/comment.query';
import { ForbiddenError, NeedToPurchaseThisCourseError } from '../libs/utils';
import ErrorHandler from '../libs/utils/errorHandler';
import type { CommentAuthorDetail, ModifiedCommentResult, TErrorHandler, TSelectComment, TSelectRate, TSelectStudent } from '../types/index.type';

export const rateCourseService = async (currentStudentId : string, courseId : string, rate : number) : Promise<TSelectRate> => {
    try {
        const studentPurchaseCache : number = await getSetListCache(`course_purchases:${courseId}`, currentStudentId);
        const studentHasPurchased : number = studentPurchaseCache ?  studentPurchaseCache 
        : (await findPurchase(courseId, currentStudentId, 'modified') ? 1 : 0)
        if(!studentHasPurchased) throw new NeedToPurchaseThisCourseError();

        const rateDetail : TSelectRate = await handelRate(currentStudentId, courseId, rate);
        await insertHashListCache(`course_rate:${courseId}`, currentStudentId, rateDetail);
        return rateDetail;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
};

export const courseRateDetailService = async (courseId : string) : Promise<number> => {
    try {
        const rateCache : Record<string, string> = await getAllHashCache(`course_rate:${courseId}`);
        const courseRateDetail : TSelectRate[] = rateCache ? Object.values(rateCache).map(rate => JSON.parse(rate) as TSelectRate[]).flat()
        : await findRatesDetail(courseId);

        const rates : TSelectRate[] = courseRateDetail.filter(rate => rate.rate !== null);
        const totalRates : number = rates.reduce((sum, rate) => sum + (rate?.rate || 0), 0);
        return rates.length > 0 ? totalRates / rates.length : 0;

    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
};

export const sendCommentService = async (currentStudentId : string, courseId : string, text : string) : Promise<ModifiedCommentResult> => {
    try {
        const commentDetail : TSelectComment = await handelInsertComment(currentStudentId, courseId, text);
        const { id, name, image, role } = await getAllHashCache<TSelectStudent>(`student:${commentDetail.authorId}`);
        const { updatedAt, text : courseText, id : course_id, createdAt } = commentDetail;
        const modifiedComment : ModifiedCommentResult = {
            updatedAt, text : courseText, id : course_id, createdAt, author : {id, name, image, role}
        }
        await insertHashListCache(`course_comments:${courseId}`, commentDetail.id, commentDetail);
        return modifiedComment
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
};

export const updateCommentService = async (studentId : string, courseId : string, commentId : string, text : string) : Promise<TSelectComment> => {
    try {
        const checkCommentAuthor : TSelectComment = JSON.parse(await getHashCache<string>(`course_comments:${courseId}`, commentId));
        if(!checkCommentAuthor || checkCommentAuthor.authorId !== studentId) throw new ForbiddenError();

        const updatedCommentDetail : TSelectComment = await updateCommentDetail(commentId, text);
        await insertHashListCache(`course_comments:${courseId}`, commentId, updatedCommentDetail);
        return updatedCommentDetail;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const deleteCommentService = async (studentId : string, courseId : string, commentId : string) : Promise<string> => {
    try {
        const checkCommentAuthor : TSelectComment = JSON.parse(await getHashCache<string>(`course_comments:${courseId}`, commentId));
        if(!checkCommentAuthor || checkCommentAuthor.authorId !== studentId) throw new ForbiddenError();
        await Promise.all([await removeComment(commentId), await removeFromHashListCache(`course_comments:${courseId}`, commentId)]);
        return 'Comment deleted successfully';
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const courseCommentsService = async (courseId : string, limit : number, startIndex : number) : Promise<ModifiedCommentResult[]> => {
    try {
        const commentsDetailCache : Record<string, string> = await getAllHashCache(`course_comments:${courseId}`);
        const parsedComments : TSelectComment[] = Object.values(commentsDetailCache)
        .map(comment => JSON.parse(comment) as TSelectComment).sort((a, b) => 
            new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        ).splice(startIndex, limit)

        const commentAuthors : CommentAuthorDetail[] = await findCommentAuthor(parsedComments.map(comment => comment.authorId!));
        const commentDetail : TSelectComment[] = Object.keys(commentsDetailCache).length ? parsedComments 
        : await courseCommentsDetail(courseId, limit, startIndex);
        return commentDetail.map(comment => {
            const { authorId, ...rest } = comment;
            return {...rest, author : commentAuthors.filter(author => author.id === authorId)[0]};
        });
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
};