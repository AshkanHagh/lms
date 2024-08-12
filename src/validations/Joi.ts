import Joi, { type ObjectSchema } from 'joi';
import { ValidationError } from '../libs/utils/customErrors';

export const validate = <T>(schema : ObjectSchema, data : T) => {
    const {error, value} = schema.validate(data, {stripUnknown : true});
    if (error) throw new ValidationError(error.message);
    return value;
};

export const authValidation = Joi.object({
    email : Joi.string().email().max(255).required().trim().regex(/^[a-zA-Z]+$/)
});

export const verifyAccountValidation = Joi.object({
    activationCode : Joi.string().trim().required().max(4),
    activationToken : Joi.string().trim().required()
});

export const socialAuthValidation = Joi.object({
    name : Joi.string().max(255).required().trim().regex(/^[a-zA-Z]+$/),
    email : Joi.string().email().max(255).required().trim().regex(/^[a-zA-Z]+$/),
    image : Joi.string().required().trim()
});

export const createCourseSchema: ObjectSchema = Joi.object({
    title : Joi.string().max(255).required().trim().regex(/^[a-zA-Z]+$/)
});

export const editCourseDetailsSchema : ObjectSchema = Joi.object({
    title : Joi.string().max(255).optional().trim().regex(/^[a-zA-Z]+$/),
    description : Joi.string().optional().trim().regex(/^[a-zA-Z]+$/),
    price : Joi.number().optional(),
    image : Joi.string().optional().trim(),
    prerequisite : Joi.array().items(Joi.string().regex(/^[a-zA-Z]+$/)).optional().allow(null),
    tags : Joi.array().items(Joi.string().regex(/^[a-zA-Z]+$/)).optional(),
    visibility : Joi.string().valid('publish', 'unpublish').optional().allow(null)
});

export const courseBenefitSchema : ObjectSchema = Joi.object({
    benefits : Joi.array().items(Joi.object({
        title : Joi.string().max(255).required().trim().regex(/^[a-zA-Z]+$/),
        details : Joi.string().required().trim().regex(/^[a-zA-Z]+$/)
    })).required()
});

export const insertChapterBodySchema : ObjectSchema = Joi.object({
    chapterDetails : Joi.object({
        title : Joi.string().max(255).required().trim().regex(/^[a-zA-Z]+$/),
        description : Joi.string().optional().trim().regex(/^[a-zA-Z]+$/),
        visibility : Joi.string().valid('publish', 'draft').optional().allow(null),
        courseId : Joi.string().optional().allow(null)
    }).required(),
    videoDetails : Joi.array().items(Joi.object({
        videoTitle : Joi.string().max(255).required().trim().regex(/^[a-zA-Z]+$/),
        videoUrl : Joi.string().uri().required().trim(),
        state : Joi.string().valid('free', 'premium').optional().allow(null)
    })).required()
});

export const updateCourseChapterSchema : ObjectSchema = Joi.object({
    title : Joi.string().max(255).optional().trim().regex(/^[a-zA-Z]+$/),
    description : Joi.string().optional().trim().regex(/^[a-zA-Z]+$/),
    visibility : Joi.string().valid('publish', 'draft').optional().allow(null)
});

export const updateChapterVideoDetailSchema : ObjectSchema = Joi.object({
    videoTitle : Joi.string().max(255).required().trim().regex(/^[a-zA-Z]+$/),
    videoUrl : Joi.string().uri().required().trim(),
    state : Joi.string().valid('free', 'premium').required()
});

export const querySchema = Joi.object({
    plan : Joi.string().valid('monthly', 'yearly').required()
});

export const courseParamsSchema: ObjectSchema = Joi.object({
    courseId : Joi.string().required(),
});

export const courseAndChapterIdSchema : ObjectSchema = Joi.object({
    courseId : Joi.string().required(),
    chapterId : Joi.string().required(),
});

export const chapterAndVideoIdSchema : ObjectSchema = Joi.object({
    chapterId : Joi.string().required(),
    videoId : Joi.string().required(),
});

export const courseAndVideoIdSchema : ObjectSchema = Joi.object({
    courseId : Joi.string().required(),
    videoId : Joi.string().required(),
});

export const CheckoutVerifyQuerySchema : ObjectSchema = Joi.object({
    session_id : Joi.string().required(),
    course_id : Joi.string().required(), 
    student_id : Joi.string().required()
});

export const markAsCompletedSchema : ObjectSchema = Joi.object({
    state : Joi.boolean().required()
});

export const vectorSearchSchema : ObjectSchema = Joi.object({
    query : Joi.string().required().regex(/^[a-zA-Z]+$/)
});