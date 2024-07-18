import type { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from './catchAsyncError';
import { AccessTokenInvalidError, LoginRequiredError, RoleForbiddenError } from '../libs/utils';
import { decodeAccessToken } from '../libs/utils/jwt';
import type { TErrorHandler, TSelectUser } from '../types/index.type';
import { getAllHashCache } from '../database/cache/index.cache';
import ErrorHandler from '../libs/utils/errorHandler';

export const isAuthenticated = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const authHeader : string | undefined = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')) return next(new LoginRequiredError());

        const accessToken : string | undefined = authHeader.split(' ')[1];
        if(!accessToken) return next(new AccessTokenInvalidError());

        const decodedToken : TSelectUser = decodeAccessToken(accessToken);
        if(!decodedToken) return next(new AccessTokenInvalidError());

        const user : TSelectUser = await getAllHashCache(`user:${decodedToken.id}`);
        if(!user) return next(new LoginRequiredError());

        req.user = user;
        next();
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        return next(new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode));
    }
});

export const authorizedRoles = (...role : string[]) => {
    return CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
        if(!role.includes(req.user?.role || '')) return next(new RoleForbiddenError(req.user?.role || 'unknown'));
        next();
    });
}