import type { NextFunction, Request, Response } from 'express';
import type { ObjectSchema } from 'joi';
import { validate } from '../validations/Joi';
import { CatchAsyncError } from './catchAsyncError';

export const validationMiddleware = (schema : ObjectSchema) => {
    return CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
        req.body = validate(schema, req.body);
        next()
    })
}

export const validateQuery = (schema : ObjectSchema) => {
    return CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
        req.query = validate(schema, req.query);
        next();
    })
}

export const validateParams = (schema : ObjectSchema) => {
    return CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
        req.query = validate(schema, req.params);
        next();
    })
}