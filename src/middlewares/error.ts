import type { NextFunction, Request, Response } from 'express';
import type { TErrorHandler } from '../types/index.type';
import * as Sentry from '@sentry/bun';

export const ErrorMiddleware = (error: TErrorHandler, req: Request, res: Response, next: NextFunction) : void => {
    error.statusCode = error.statusCode || 500;
    error.message = error.message || 'Internal server error';

    Sentry.captureException(error.message);
    res.status(Number(error.statusCode)).json({success : false, message : error.message});
}