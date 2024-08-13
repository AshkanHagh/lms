import Joi, { type ObjectSchema } from 'joi';
import { ValidationError } from '../libs/utils/customErrors';

export const validate = <T>(schema : ObjectSchema, data : T) => {
    const {error, value} = schema.validate(data, {stripUnknown : true});
    if (error) throw new ValidationError(error.message);
    return value;
};

export const authValidation = Joi.object({
    email : Joi.string().email().max(255).required().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
});

export const verifyAccountValidation = Joi.object({
    activationCode : Joi.string().trim().required().max(4),
    activationToken : Joi.string().trim().required()
});

export const socialAuthValidation = Joi.object({
    name : Joi.string().max(255).required().trim().regex(/^[a-zA-Z\s'-]+$/),
    email : Joi.string().email().max(255).required().trim().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    image : Joi.string().required().trim()
});

export const createCourseSchema: ObjectSchema = Joi.object({
    title : Joi.string().max(255).required().trim().regex(/^[a-zA-Z\s'-]+$/)
});

export const editCourseDetailsSchema : ObjectSchema = Joi.object({
    title : Joi.string().max(255).optional().trim().regex(/^[a-zA-Z\s'-]+$/),
    description : Joi.string().optional().trim().max(500).regex(/^[a-zA-Z\s'-]+$/),
    price : Joi.number().optional(),
    image : Joi.string().optional().trim(),
    prerequisite : Joi.array().items(Joi.string().regex(/^[a-zA-Z\s'-]+$/)).optional().allow(null),
    tags : Joi.array().items(Joi.string().regex(/^[a-zA-Z\s'-]+$/)).optional(),
    visibility : Joi.string().valid('publish', 'unpublish').optional().allow(null)
});

export const courseBenefitSchema : ObjectSchema = Joi.object({
    benefits : Joi.array().items(Joi.object({
        title : Joi.string().max(255).required().trim().regex(/^[a-zA-Z\s'-]+$/),
        details : Joi.string().required().trim().regex(/^[a-zA-Z\s'-]+$/)
    })).required()
});

export const insertChapterBodySchema : ObjectSchema = Joi.object({
    chapterDetails : Joi.object({
        title : Joi.string().max(255).required().trim().regex(/^[a-zA-Z\s'-]+$/),
        description : Joi.string().optional().trim().regex(/^[a-zA-Z\s'-]+$/),
        visibility : Joi.string().valid('publish', 'draft').optional().allow(null),
        courseId : Joi.string().optional().allow(null)
    }).required(),
    videoDetails : Joi.array().items(Joi.object({
        videoTitle : Joi.string().max(255).required().trim().regex(/^[a-zA-Z\s'-]+$/),
        videoUrl : Joi.string().uri().required().trim(),
        state : Joi.string().valid('free', 'premium').optional().allow(null)
    })).required()
});

export const updateCourseChapterSchema : ObjectSchema = Joi.object({
    title : Joi.string().max(255).optional().trim().regex(/^[a-zA-Z\s'-]+$/),
    description : Joi.string().optional().trim().regex(/^[a-zA-Z\s'-]+$/),
    visibility : Joi.string().valid('publish', 'draft').optional().allow(null)
});

export const updateChapterVideoDetailSchema : ObjectSchema = Joi.object({
    videoTitle : Joi.string().max(255).required().trim().regex(/^[a-zA-Z\s'-]+$/),
    videoUrl : Joi.string().uri().required().trim(),
    state : Joi.string().valid('free', 'premium').required()
});

export const querySchema = Joi.object({
    plan : Joi.string().valid('monthly', 'yearly').required()
});

export const courseParamsSchema: ObjectSchema = Joi.object({
    courseId : Joi.string().required().uuid(),
});

export const courseAndChapterIdSchema : ObjectSchema = Joi.object({
    courseId : Joi.string().required().uuid(),
    chapterId : Joi.string().required().uuid(),
});

export const chapterAndVideoIdSchema : ObjectSchema = Joi.object({
    chapterId : Joi.string().required().uuid(),
    videoId : Joi.string().required().uuid(),
});

export const courseAndVideoIdSchema : ObjectSchema = Joi.object({
    courseId : Joi.string().required().uuid(),
    videoId : Joi.string().required().uuid(),
});

export const CheckoutVerifyQuerySchema : ObjectSchema = Joi.object({
    session_id : Joi.string().required(),
    course_id : Joi.string().required().uuid(), 
    student_id : Joi.string().required().uuid()
});

export const markAsCompletedSchema : ObjectSchema = Joi.object({
    state : Joi.boolean().required()
});

export const vectorSearchSchema : ObjectSchema = Joi.object({
    query : Joi.string().required().regex(/^[a-zA-Z\s'-]+$/)
});

export const rateCourseSchema : ObjectSchema = Joi.object({
    rate : Joi.number().min(1).max(5).valid(1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5).required()
});

export const sendCommentSchema : ObjectSchema = Joi.object({
    text : Joi.string().required().max(500)
});

export const paginationQuerySchema : ObjectSchema = Joi.object({
    limit : Joi.string().min(0).max(50).required(),
    startIndex : Joi.string().min(0).required()
});

export const courseAndCommentIdSchema : ObjectSchema = Joi.object({
    courseId : Joi.string().required().uuid(),
    commentId : Joi.string().required().uuid(),
});