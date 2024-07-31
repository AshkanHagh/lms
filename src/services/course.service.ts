import { getAllHashCache, getHashCache, insertHashCache, insertHashListCache, removeFromHashListCache } from '../database/cache/index.cache';
import { findSimilarTags, insertChapterAndVideos, insertCourse, insertCourseBenefit, insertNewTags, removeTags, 
    updateCourse, updateTags } from '../database/queries/course.query';
import { ForbiddenError } from '../libs/utils';
import ErrorHandler from '../libs/utils/errorHandler';
import type { ChapterAndVideoDetails, courseBenefitAndDetails, CourseGeneric, InsectCourseDetailsBody, ModifiedChapterDetail, TagsEntries, TErrorHandler, TSelectCourse, TSelectCourseBenefit, TSelectTags, TSelectVideoDetails, uploadVideoDetailResponse, } from '../types/index.type';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import pLimit from 'p-limit';

export const createCourseService = async <T extends CourseGeneric<'insert'>>(courseDetail : InsectCourseDetailsBody<T>) : Promise<TSelectCourse> => {
    try {
        const courseDetails : TSelectCourse = await insertCourse(courseDetail);
        await insertHashCache(`course:${courseDetails.id}`, courseDetails);
        return courseDetails;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
};

export const editCourseDetailsService = async <B extends CourseGeneric<'update'>>(courseDetail : Partial<InsectCourseDetailsBody<B>>, 
    courseId : string, currentUserId : string, tags : string[]) : Promise<TSelectCourse> => {
    try {
        let currentTags : TSelectTags[];
        const [courseCache, currentTagsData] : [TSelectCourse, Record<string, string>] = await Promise.all([
            getAllHashCache<TSelectCourse>(`course:${courseId}`), getAllHashCache<Record<string, string>>(`course_tags:${courseId}`)
        ]);
        if(courseCache.teacherId !== currentUserId) throw new ForbiddenError();

        const newTagsSet : Set<string> = new Set(tags);

        const entries : TagsEntries[] = Object.entries(currentTagsData).map(([key, value]) => ({key, value}));
        currentTags = entries.map(entry => JSON.parse(entry.value)) as TSelectTags[];
        if(Object.keys(currentTagsData).length === 0) currentTags = await findSimilarTags(courseId) as TSelectTags[];

        const existingTagsSet : Set<string> = new Set(currentTags.map(tag => tag.tags));
        const tagsToAdd : string[] = tags.filter(tag => !existingTagsSet.has(tag));
        const removedTags : TSelectTags[] = currentTags.filter(tagObj => !newTagsSet.has(tagObj.tags))
        const updatedTags : TSelectTags[] = currentTags.filter(tagObj => newTagsSet.has(tagObj.tags) && !tags.includes(tagObj.tags));

        await handleTags(tagsToAdd, removedTags, updatedTags, courseId);
        const uploadedImageUrl : string | undefined = await handleImageUpload(courseDetail.image!, courseCache.image);

        const updatedDetails : TSelectCourse = await updateCourse({
            ...courseDetail, image : uploadedImageUrl, prerequisite : courseDetail.prerequisite?.join(' ')
        }, courseId);
        await insertHashCache(`course:${courseId}`, updatedDetails);
        return updatedDetails;

    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const combineTagAndCourseId = (tags : string[], courseId : string) : Omit<TSelectTags, 'id'>[] => {
    return tags.map(tag => ({tags : tag, courseId}));
}

export const handleTags = async (tagsToAdd : string[], removedTags : TSelectTags[], updatedTags : TSelectTags[], courseId : string) : 
Promise<void> => {
    const operations = [
        () => insertNewTagsIfNeeded(tagsToAdd, courseId),
        () => removeTagsIfNeeded(removedTags, courseId),
        ...updatedTags.map(tag => () => updateTags(tag.id, tag.tags))
    ];
    await Promise.all(operations.map(operation  => operation()));
}

export const insertNewTagsIfNeeded = async (tagsToAdd : string[], courseId : string) : Promise<void> => {
    if(tagsToAdd.length > 0) {
        const newTags : TSelectTags[] = await insertNewTags(combineTagAndCourseId(tagsToAdd, courseId));
        newTags.map(async tag => await insertHashListCache(`course_tags:${courseId}`, tag.id, tag))
    }
}

const removeTagsIfNeeded = async (removedTags : TSelectTags[], courseId : string) : Promise<void> => {
    if (removedTags.length > 0) {
        await removeTags(removedTags.map(tag => tag.id));
        removedTags.map(async tag => await removeFromHashListCache(`course_tags:${courseId}`, tag.id));
    }
}
const handleImageUpload = async (newImage : string | null, currentImage : string | null) : Promise<string | undefined> => {
    if(currentImage && currentImage.length > 0) {
        await cloudinary.uploader.destroy(currentImage.split('/').pop()!.split('.')[0]);
        const uploadResponse = await cloudinary.uploader.upload(newImage!);
        return uploadResponse.secure_url;
    }
    const uploadedResponse : UploadApiResponse | undefined = newImage ? await cloudinary.uploader.upload(newImage) : undefined
    return uploadedResponse ? uploadedResponse.secure_url : undefined;
}

export const courseBenefitService = async (benefits : Omit<TSelectCourseBenefit, 'id'>[], courseId : string, currentUserId : string) : 
 Promise<courseBenefitAndDetails> => {
    try {
        const course : TSelectCourse = await getAllHashCache(`course:${courseId}`);
        if(course.teacherId !== currentUserId) throw new ForbiddenError();

        const benefitResult : TSelectCourseBenefit[] = await insertCourseBenefit(benefits);
        await Promise.all(benefitResult.map<void>(async benefit => {
            insertHashCache(`course_benefits:${benefit.id}`, benefit)
        }));

        return {course, benefits : benefitResult};
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const createCourseChapterService = async (videoDetails : TSelectVideoDetails[], chapterDetail : ModifiedChapterDetail, 
    courseId : string, currentUserId : string) : Promise<ChapterAndVideoDetails> => {
    try {
        const uploadedResponse : uploadVideoDetailResponse[] = await uploadVideoDetails(videoDetails);
        const responseMap : Map<string, uploadVideoDetailResponse> = new Map(uploadedResponse.map(upload => [upload.videoTitle, upload]));

        videoDetails.forEach(video => {
            const upload : uploadVideoDetailResponse | undefined = responseMap.get(video.videoTitle);
            if(upload) video.videoUrl = upload.videoUploadResponse.secure_url;
        });

        const courseTeacherId : string = await getHashCache(`course:${courseId}`, 'teacherId');
        if(courseTeacherId !== currentUserId) throw new ForbiddenError();
        
        const { chapterDetails, videoDetail } = await insertChapterAndVideos({
            ...chapterDetail, courseId : courseId
        }, videoDetails);

        await insertHashCache(`course:${courseId}:chapters:${chapterDetails.id}`, chapterDetails),
        await Promise.all(videoDetail.map(async video => {
            insertHashListCache(`chapter_videos:${chapterDetails.id}`, video.videoTitle, video);
        }));

        return { chapterDetails : chapterDetails, videoDetail } as ChapterAndVideoDetails;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

const uploadVideoDetails = async (videoDetails : TSelectVideoDetails[]) : Promise<uploadVideoDetailResponse[]> => {
    const limit = pLimit(10);
    const uploadResponse : Promise<uploadVideoDetailResponse>[] = videoDetails.map(video => {
        return limit(async () => {
            const videoUploadResponse : UploadApiResponse = await cloudinary.uploader.upload_large(video.videoUrl, {
                resource_type : 'video'
            });
            return {videoTitle : video.videoTitle, videoUploadResponse};
        });
    });
    const uploadedResponse : uploadVideoDetailResponse[] = await Promise.all(uploadResponse);
    return uploadedResponse;
}