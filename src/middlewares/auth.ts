import type { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from './catchAsyncError';
import { AccessTokenInvalidError, LoginRequiredError, RoleForbiddenError } from '../libs/utils';
import { decodeAccessToken } from '../libs/utils/jwt';
import type { TSelectStudent } from '../types/index.type';
import { getAllHashCache } from '../database/cache/index.cache';

export const isAuthenticated = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    const authHeader : string | undefined = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')) return next(new LoginRequiredError());

    const accessToken : string | undefined = authHeader.split(' ')[1];
    if(!accessToken) return next(new AccessTokenInvalidError());

    const decodedToken : TSelectStudent = decodeAccessToken(accessToken);
    if(!decodedToken) return next(new AccessTokenInvalidError());

    const user : TSelectStudent = await getAllHashCache(`student:${decodedToken.id}`);
    if(!user) return next(new LoginRequiredError());

    req.student = user;
    next();
});

export const authorizedRoles = (...role : string[]) => {
    return CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
        if(!role.includes(req.student?.role || '')) return next(new RoleForbiddenError(req.student?.role || 'unknown'));
        next();
    });
}