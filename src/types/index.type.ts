import type { InferSelectModel } from 'drizzle-orm';
import type { chapterVideosTable, courseBenefitTable, courseChaptersTable, courseTable, courseTagsTable, userTable } from '../database/schema';
import type { UploadApiResponse } from 'cloudinary';

export type TErrorHandler = {
    statusCode : number; message : string
}

export type TActivationToken = {
    activationCode : string; activationToken : string;
}

export type TVerifyActivationToken = {
    user : TModifiedUser; activationCode : string;
}

export type TVerifyAccount = {
    activationCode : string; activationToken : string;
}

export type TSelectUser = InferSelectModel<typeof userTable>;
export type TModifiedUser = Omit<TSelectUser, 'customerId'>;

export type TSelectCourse = InferSelectModel<typeof courseTable>;
export type InsectCourseDetails = Pick<TSelectCourse, 'title' | 'details' | 'price' | 'image' | 'prerequisite' | 'teacherId'>;
export type InsectCourseDetailsBody = 
Pick<TSelectCourse, 'title' | 'details' | 'price' | 'image' | 'teacherId'> & {prerequisite : string[]};

export type TSelectCourseBenefit = InferSelectModel<typeof courseBenefitTable>;

export type TSelectChapter = InferSelectModel<typeof courseChaptersTable>;
export type ModifiedChapterDetail = Omit<TSelectChapter, 'id'>

export type TSelectVideoDetails = InferSelectModel<typeof chapterVideosTable>

export type courseBenefitAndDetails = {
    benefits : TSelectCourseBenefit[]; course : TSelectCourse
}

export type TUserResultClient = Omit<TSelectUser, 'updatedAt' | 'createdAt' | 'customerId'>;

export type TCookieOptions = {
    expires : Date; maxAge : number, httpOnly : boolean; sameSite : 'lax' | 'strict' | 'none'; secure? : boolean;
}

export type TInsertCache<T> = {
    [field : string] : T
}

export type TSendToken = {
    accessToken : string; others : TUserResultClient;
}

export type TokenResponse<T> = T extends 'refresh' ? {accessToken : string} : TSendToken;
export type SelectCondition<T> = T extends 'emailOnly' ? Pick<TModifiedUser, 'email'> : TSelectUser

declare module 'express-serve-static-core' {
    interface Request {
        user? : TSelectUser;
    }
}

export type UpdateAccount = {
    firstName : string | undefined; lastName : string | undefined
}

export type insertChapterBody = {
    videoDetails : TSelectVideoDetails[]; chapterDetails : ModifiedChapterDetail
}

export type ChapterAndVideoDetails = {
    videoDetail : TSelectVideoDetails[]; chapterDetails : TSelectChapter
}

export type uploadVideoDetailResponse = {
    videoTitle : string;
    videoUploadResponse : UploadApiResponse;
    thumbnailUploadResponse : UploadApiResponse;
}

export type TSelectTags = InferSelectModel<typeof courseTagsTable>;

export type CourseParams = {courseId : string};