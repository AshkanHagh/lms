import { getAllHashCache, getHashCache, getSetListCache, insertHashListCache, removeFromHashListCache } from '../database/cache/index.cache';
import { findCommentAuthor } from '../database/cache/student.cache';
import { findPurchase } from '../database/queries/checkout.query';
import { courseCommentsDetail, deleteReplay, findRatesDetail, findReplies, handelInsertComment, handelRate, insertReplay, removeComment, 
    updateCommentDetail, updateReplayDetail, 
    type ModifiedRepliesWithAuthor} from '../database/queries/comment.query';
import { BadRequestError, NeedToPurchaseThisCourseError } from '../libs/utils';
import ErrorHandler from '../libs/utils/errorHandler';
import type { CommentAuthorDetail, ModifiedCommentResult, ModifiedSendReplay, TErrorHandler, TSelectComment, TSelectRate, 
    TSelectReplay
} from '../types/index.type';

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
// 1. use req.student for author information
export const sendCommentService = async (student : CommentAuthorDetail, courseId : string, text : string) : Promise<ModifiedCommentResult> => {
    try {
        const commentDetail : TSelectComment = await handelInsertComment(student.id, courseId, text);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { authorId, ...rest } = commentDetail;
        const modifiedComment : ModifiedCommentResult = {...rest, author : student}
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
        if(!checkCommentAuthor || checkCommentAuthor.authorId !== studentId) throw new BadRequestError();

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
        if(!checkCommentAuthor || checkCommentAuthor.authorId !== studentId) throw new BadRequestError();
        await Promise.all([removeComment(commentId), removeFromHashListCache(`course_comments:${courseId}`, commentId)]);
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
        .map(comment => JSON.parse(comment) as TSelectComment)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()).splice(startIndex, limit)

        const commentAuthors : CommentAuthorDetail[] = await findCommentAuthor(parsedComments.map(comment => comment.authorId!));
        const commentDetail : TSelectComment[] = Object.keys(commentsDetailCache).length ? parsedComments 
        : await courseCommentsDetail(courseId, limit, startIndex);
        return commentDetail.map(comment => {
            const { authorId, ...rest } = comment;
            return {...rest, author : commentAuthors.find(author => author.id === authorId)!};
        });
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
};

export const sendReplayService = async (student : CommentAuthorDetail, courseId : string, commentId : string, text : string) : 
Promise<ModifiedSendReplay> => {
    try {
        const commentCache : TSelectComment = JSON.parse(await getHashCache<string>(`course_comments:${courseId}`, commentId));
        if(!commentCache) throw new BadRequestError();

        const replayDetail : TSelectReplay = await insertReplay(commentId, student.id, text);
        await insertHashListCache(`comment_replies:${commentId}`, replayDetail.id, replayDetail);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { authorId, ...rest } = replayDetail;
        return {...rest, author : student};
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const updateReplayService = async (student : CommentAuthorDetail, commentId : string, replayId : string, text : string) : 
Promise<ModifiedSendReplay> => {
    try {
        const replayCache : TSelectReplay = JSON.parse(await getHashCache<string>(`comment_replies:${commentId}`, replayId));
        if(!replayCache || replayCache.authorId !== student.id) throw new BadRequestError();

        const updatedReplayDetail : TSelectReplay = await updateReplayDetail(replayId, text);
        await insertHashListCache(`comment_replies:${commentId}`, replayId, updatedReplayDetail);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { authorId, ...rest } = updatedReplayDetail;
        return {...rest, author : student};
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const removeReplayService = async (studentId : string, commentId : string, replayId : string) : Promise<string> => {
    try {
        const replayCache : TSelectReplay = JSON.parse(await getHashCache<string>(`comment_replies:${commentId}`, replayId));
        if(!replayCache || replayCache.authorId !== studentId) throw new BadRequestError();
        await Promise.all([deleteReplay(replayId), removeFromHashListCache(`comment_replies:${commentId}`, replayId)]);
        return 'Replay deleted successfully';
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
};

export const repliesDetailService = async (commentId : string, limit : number, startIndex : number) => {
    try {
        const repliesCache : Record<string, string> = await getAllHashCache(`comment_replies:${commentId}`);
        const sortedAndParsedReplies : TSelectReplay[] = Object.values(repliesCache).map(replay => JSON.parse(replay) as TSelectReplay)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .splice(startIndex, limit);

        const repliesAuthor : CommentAuthorDetail[] = await findCommentAuthor(sortedAndParsedReplies.map(replay => replay.authorId!));
        const combineReplayAndAuthor : ModifiedRepliesWithAuthor[] = sortedAndParsedReplies.map(replay => {
            const replayAuthor : CommentAuthorDetail | undefined = repliesAuthor.find(author => author.id === replay.authorId);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { authorId, ...rest } = replay;
            return {...rest, author : replayAuthor!}
        });

        const repliesDetail : ModifiedRepliesWithAuthor[] = sortedAndParsedReplies 
        ? combineReplayAndAuthor : await findReplies(commentId, limit, startIndex);
        return repliesDetail;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}