import Joi, { type ObjectSchema } from 'joi';
import { ValidationError } from '../libs/utils/customErrors';

// const validator = (schema : ObjectSchema) => (payload : ObjectSchema) => schema.validate(payload, {abortEarly : false});

export const validate = <T>(schema: ObjectSchema, data: T) => {
    const {error, value} = schema.validate(data, {stripUnknown: true});
    if (error) throw new ValidationError(error.message);
    return value;
};

export const authValidation = Joi.object({
    email : Joi.string().email().max(255).required().trim()
});

export const verifyAccountValidation = Joi.object({
    activationCode : Joi.string().trim().required().max(4),
    activationToken : Joi.string().trim().required()
});

export const socialAuthValidation = Joi.object({
    name : Joi.string().max(255).required().trim(),
    email : Joi.string().email().max(255).required().trim(),
    image : Joi.string().required().trim()
});

// export const courseValidation = Joi.object({
//     title : Joi.string().max(500).required().trim(),
//     details : Joi.string().max(500).required().trim(),
//     prerequisite : Joi.array().required(),
//     image : Joi.string().required().trim(),
//     price : Joi.number().required()
// });