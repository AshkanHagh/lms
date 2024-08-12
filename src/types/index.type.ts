import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import type { chapterVideosTable, completeState, courseBenefitTable, courseChaptersTable, courseTable, courseTagsTable, purchaseCoursesTable, 
    studentTable, 
    subscriptionTable} from '../database/schema';
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
export type Teacher = Pick<TSelectStudent, 'email' | 'id' | 'name' | 'image'>

export type TSelectCourse = InferSelectModel<typeof courseTable>;
export type InsectCourseDetails = Omit<TSelectCourse, 'id' | 'updatedAt' | 'createdAt'>;

export type InsectCourseDetailsBody<T> = 
T extends 'insert' ? Pick<TSelectCourse, 'title' | 'teacherId'> : 
Omit<TSelectCourse, 'id' | 'createdAt' | 'updatedAt' | 'prerequisite'> & {prerequisite : string[] | null};

export type TSelectCourseBenefit = InferSelectModel<typeof courseBenefitTable>;

export type TSelectChapter = InferSelectModel<typeof courseChaptersTable>;
export type ModifiedChapterDetail = Omit<TSelectChapter, 'id'>

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
    accessToken : string; sanitizedStudent : TStudentResultClient;
}

export type TokenResponse<T> = T extends 'refresh' ? {accessToken : string} : TSendToken;
export type SelectCondition<T> = T extends 'emailOnly' ? Pick<TModifiedStudent, 'email'> : TSelectStudent

declare module 'express-serve-static-core' {
    interface Request {
        student? : TSelectStudent;
        course : TSelectCourse;
    }
}

export type UpdateAccount = {
    firstName : string | undefined; lastName : string | undefined
}

export type insertChapterBody = {
    videoDetails : Omit<TSelectVideoDetails, 'id'>[]; chapterDetails : ModifiedChapterDetail
}

export type ChapterAndVideoDetails = {
    videoDetail : TSelectVideoDetails[]; chapterDetails : TSelectChapter
}

export type uploadVideoDetailResponse = {
    videoTitle : string;
    videoUploadResponse : UploadApiResponse;
}

export type InsertVideoDetails = Pick<TSelectVideoDetails, 'state' | 'videoTitle' | 'videoUrl'>;

export type TSelectTags = InferSelectModel<typeof courseTagsTable>;
export type Entries = {key : string, value : string}

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

export type CourseRelations = TSelectCourse & {
    benefits : TSelectCourseBenefit[] | null; chapters : (TSelectChapter & { videos : TSelectVideoDetails[] })[] | null;
    tags : TSelectTags[]; teacher : Teacher | null; purchases : {studentId : string | null}[] | null;
} | undefined;

export type ModifiedCourseRelations = TSelectCourse & {
    benefits : TSelectCourseBenefit[] | null; chapters : (TSelectChapter & { videos : TSelectVideoDetails[] })[] | null;
    tags : TSelectTags[]; teacher : Teacher | null; purchases : number | null;
} | undefined;

export type FilteredChapters = (TSelectChapter & { videos : TSelectVideoDetails[] })[] | undefined

export type TSelectSubscription = InferSelectModel<typeof subscriptionTable>;
export type TInsertSubscription = InferInsertModel<typeof subscriptionTable>;

export type ChapterDetails = TSelectChapter & {videos : TSelectVideoDetails[]};
export type CoursePurchase = {purchases : TSelectPurchases[]}
export type PurchaseDetailRes = Omit<TSelectPurchases, 'courseId'> & {course : Pick<TSelectCourse, 'title' | 'price' | 'id'>};

export type CourseRelationsPurchases = {
    studentId : string | null
}

export type CourseAndChapterId = {
    courseId : string; chapterId : string
}
export type ChapterAndVideoId = {
    videoId : string; chapterId : string
}
export type CourseAndVideoId = {
    videoId : string; courseId : string
}

export type SelectVideoCompletion = InferSelectModel<typeof completeState>;
export type InsertVideoCompletion = InferInsertModel<typeof completeState>;

export type CourseStateResult = {
    remainingVideos : TSelectVideoDetails[]; progressPercentage : number;
}

export type MostUsedTagsMap = {tag : TSelectTags, count : number}

export type VectorSeed = Pick<TSelectCourse, 'id' | 'description' | 'title' | 'visibility' | 'image' | 'price'>;
export type VectorResult = {score : number, course : VectorSeed};

export type TransactionResult = {
    modifiedPurchase : PurchaseDetailRes[]; subscriptionDetail : TSelectSubscription;
}

export type PaginationQuery = {
    limit : string; startIndex : string;
}
export type Pagination = {
    limit : number; startIndex : number;
}

export type CoursesWithPurchaseDetail = TSelectCourse & {purchases : Pick<TSelectPurchases, 'studentId'>[]}

export type PurchasedCoursesWithRelations = {
    course: TSelectCourse & {
        chapters: {
            videos: TSelectVideoDetails[];
        }[];
    } | null;
};

export type ModifiedRelationsCourse = TSelectCourse & {
    chapters : TSelectVideoDetails[]
}

export type CoursesProgress = Omit<ModifiedRelationsCourse, 'chapters'> & {progress : number};