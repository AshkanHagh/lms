import { getAllHashCache, getHashCache, insertHashCache, insertHashListCache, removeFromHashListCache } from '../database/cache/index.cache';
import { findSimilarTags, insertChapterAndVideos, insertCourse, insertCourseBenefit, insertNewTags, removeTags, updateCourse, updateTags } from '../database/queries/course.query';
import { ForbiddenError } from '../libs/utils';
import ErrorHandler from '../libs/utils/errorHandler';
import type { ChapterAndVideoDetails, courseBenefitAndDetails, InsectCourseDetailsBody, ModifiedChapterDetail, TErrorHandler, TSelectCourse, TSelectCourseBenefit, TSelectTags, TSelectVideoDetails, uploadVideoDetailResponse, } from '../types/index.type';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import pLimit from 'p-limit';
import { uuid } from 'uuidv4';

export const createCourseService = async (courseDetail : InsectCourseDetailsBody) : Promise<TSelectCourse> => {
    try {
        const uploadedResponse : UploadApiResponse = await cloudinary.uploader.upload(courseDetail.image);
        courseDetail.image = uploadedResponse.secure_url;

        const {prerequisite, ...others} = courseDetail;
        const courseDetails : TSelectCourse = await insertCourse({...others, prerequisite : prerequisite.join(' ')});
        await insertHashCache(`course:${courseDetails.id}`, courseDetails);

        return courseDetails;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
};

export const editCourseDetailsService = async (courseDetail : Partial<InsectCourseDetailsBody>, courseId : string, 
    currentUserId : string, tags : string[]) : Promise<TSelectCourse> => {
    try {
        const courseTeacherId : string = await getHashCache(`course:${courseId}`, 'teacherId');
        if(courseTeacherId !== currentUserId) throw new ForbiddenError();

        const newTagsSet : Set<string> = new Set(tags);
        const currentTags : TSelectTags[] = await findSimilarTags(courseId);
        const existingTagsSet : Set<string> = new Set(currentTags.map(tag => tag.tags));

        await handleInitialTags(currentTags, tags, courseId);

        const tagsToAdd : string[] = tags.filter(tag => !existingTagsSet.has(tag));
        const removedTags : TSelectTags[] = currentTags.filter(tagObj => !newTagsSet.has(tagObj.tags))
        const updatedTags : TSelectTags[] = currentTags.filter(tagObj => newTagsSet.has(tagObj.tags) && !tags.includes(tagObj.tags));

        await handleTags(tagsToAdd, removedTags, updatedTags, courseId);

        const { prerequisite, ...others } = courseDetail;
        const updatedDetails : TSelectCourse = await updateCourse({
            ...others, prerequisite : prerequisite !== undefined ? prerequisite.join(' ') : undefined}, courseId);
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

const handleInitialTags = async (currentTags : TSelectTags[], tags : string[], courseId : string) : Promise<void> => {
    if (currentTags.length === 0 && tags.length > 0) {
        const newTags : TSelectTags[] = await insertNewTags(combineTagAndCourseId(tags, courseId));
        newTags.map(async tag => await insertHashListCache(`course_tags${courseId}`, tag.id, tag))
    }
}

export const insertNewTagsIfNeeded = async (tagsToAdd : string[], courseId : string) : Promise<void> => {
    if(tagsToAdd.length > 0) {
        const newTags : TSelectTags[] = await insertNewTags(combineTagAndCourseId(tagsToAdd, courseId));
        newTags.map(async tag => await insertHashListCache(`course_tags${courseId}`, tag.id, tag))
    }
}

const removeTagsIfNeeded = async (removedTags : TSelectTags[], courseId : string) : Promise<void> => {
    if (removedTags.length > 0) {
        await removeTags(removedTags.map(tag => tag.id));
        removedTags.map(async tag => await removeFromHashListCache(`course_tags:${courseId}`, tag.id));
    }
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

export const createCourseChapterService = async (
    videoDetails : TSelectVideoDetails[], chapterDetail : Pick<ModifiedChapterDetail, 'title'>, courseId : string, currentUserId : string) : 
    Promise<ChapterAndVideoDetails> => {
    try {
        const uploadedResponse : uploadVideoDetailResponse[] = await uploadVideoDetails(videoDetails);
        const responseMap : Map<string, uploadVideoDetailResponse> = new Map(uploadedResponse.map(upload => [upload.videoTitle, upload]));

        videoDetails.forEach(video => {
            const upload : uploadVideoDetailResponse | undefined = responseMap.get(video.videoTitle);
            if(upload) {
                video.videoThumbnail = upload.thumbnailUploadResponse.secure_url;
                video.videoUrl = upload.videoUploadResponse.secure_url;
                video.videoTime = Math.floor(upload.videoUploadResponse.duration);
            }
        });

        const courseTeacherId : string = await getHashCache(`course:${courseId}`, 'teacherId');
        if(courseTeacherId !== currentUserId) throw new ForbiddenError();
        
        const { chapterDetails, videoDetail : newVideoDetails } = await insertChapterAndVideos({
            ...chapterDetail, courseId : courseId, chapterEpisodes : videoDetails.length
        }, videoDetails);

        await insertHashCache(`course:${courseId}:chapters:${chapterDetails.id}`, chapterDetails),
        await Promise.all(newVideoDetails.map(async video => {
            insertHashListCache(`chapter_videos:${chapterDetails.id}`, video.videoTitle, video);
        }));

        return { chapterDetails : chapterDetails, videoDetail : newVideoDetails } as ChapterAndVideoDetails;
        
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
                resource_type : 'video', public_id : `video_${video.videoTitle.replace(/ /g, '_')}_${uuid()}`
            });
            const thumbnailUploadResponse : UploadApiResponse = await cloudinary.uploader.upload(video.videoThumbnail, {
                public_id : `thumbnail_${video.videoTitle.replace(/ /g, '_')}_${uuid()}`
            });
            return {videoTitle : video.videoTitle, videoUploadResponse, thumbnailUploadResponse};
        });
    });
    const uploadedResponse : uploadVideoDetailResponse[] = await Promise.all(uploadResponse);
    return uploadedResponse;
}