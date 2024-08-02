import type { InferSelectModel } from 'drizzle-orm';
import type { chapterVideosTable, courseBenefitTable, courseChaptersTable, courseTable, courseTagsTable, purchaseCoursesTable, 
    studentTable } from '../database/schema';
import type { UploadApiResponse } from 'cloudinary';

export type TErrorHandler = {
    statusCode : number; message : string
}

export type TActivationToken = {
    activationCode : string; activationToken : string;
}

export type TVerifyActivationToken = {
    student : TModifiedStudent; activationCode : string;
}

export type TVerifyAccount = {
    activationCode : string; activationToken : string;
}

export type TSelectStudent = InferSelectModel<typeof studentTable>;
export type TModifiedStudent = Omit<TSelectStudent, 'customerId'>;

export type TSelectCourse = InferSelectModel<typeof courseTable>;
export type InsectCourseDetails = Pick<TSelectCourse, 'title' | 'description' | 'prerequisite' | 'price' | 'image' | 'teacherId'>;

export type InsectCourseDetailsBody<T> = 
T extends 'insert' ? Pick<TSelectCourse, 'title' | 'teacherId'> : 
Omit<TSelectCourse, 'id' | 'createdAt' | 'updatedAt' | 'prerequisite'> & {prerequisite : string[]};

export type TSelectCourseBenefit = InferSelectModel<typeof courseBenefitTable>;

export type TSelectChapter = InferSelectModel<typeof courseChaptersTable>;
export type ModifiedChapterDetail = Omit<TSelectChapter, 'id' | 'visibility'>

export type TSelectVideoDetails = InferSelectModel<typeof chapterVideosTable>

export type courseBenefitAndDetails = {
    benefits : TSelectCourseBenefit[]; course : TSelectCourse
}

export type TStudentResultClient = Omit<TSelectStudent, 'updatedAt' | 'createdAt' | 'customerId'>;

export type TCookieOptions = {
    expires : Date; maxAge : number, httpOnly : boolean; sameSite : 'lax' | 'strict' | 'none'; secure? : boolean;
}

export type TInsertCache<T> = {
    [field : string] : T
}

export type TSendToken = {
    accessToken : string; others : TStudentResultClient;
}

export type TokenResponse<T> = T extends 'refresh' ? {accessToken : string} : TSendToken;
export type SelectCondition<T> = T extends 'emailOnly' ? Pick<TModifiedStudent, 'email'> : TSelectStudent

declare module 'express-serve-static-core' {
    interface Request {
        student? : TSelectStudent;
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
}

export type TSelectTags = InferSelectModel<typeof courseTagsTable>;
export type TagsEntries = {key : string, value : string}

export type CourseParams = {courseId : string};

export type CourseGeneric<T extends 'insert' | 'update'> = T

export type TSelectPurchases = InferSelectModel<typeof purchaseCoursesTable>;
export type ModifiedPurchase = Omit<TSelectPurchases, 'brand' | 'card' | 'expMonth' | 'expYear' | 'paymentId'>;

export type PaymentIntent = {
    payment_intent : {
        payment_method : {
            id : string;
            card : {brand : string, last4 : string, exp_month : number, exp_year : number};
        }
    }
}

export type CompletePaymentQueries = {
    session_id : string; course_id : string; student_id : string;
}

export type CheckPurchaseReturnValue = 'modified' | 'full';
export type CheckPurchaseValue<T> = T extends 'modified' ? ModifiedPurchase : TSelectPurchases