import type { Request, Response } from 'express';
import { CatchAsyncError } from '../middlewares/catchAsyncError';
import type { TModifiedStudent, TSelectStudent, TVerifyAccount } from '../types/index.type';
import { loginService, refreshTokenService, registerService, socialAuthService, verifyAccountService } from '../services/auth.service';
import { sendToken } from '../libs/utils/jwt';
import { deleteHashCache } from '../database/cache/index.cache';

export const register = CatchAsyncError(async (req : Request, res : Response) => {
    const { email } = req.body as Pick<TModifiedStudent, 'email'>;
    const activationToken : string = await registerService(email.toLowerCase());
    res.status(200).json({success : true, activationToken});
});

export const verifyAccount = <T extends 'login' | 'register'>(condition : T) => {
    return CatchAsyncError(async (req : Request, res : Response) => {
        const { activationCode, activationToken } = req.body as TVerifyAccount;
        const verifyResult : TSelectStudent = await verifyAccountService(activationToken, activationCode, condition);

        const { accessToken, sanitizedStudent } = await sendToken(verifyResult, res, 'login');
        res.status(200).json({success : true, student : sanitizedStudent , accessToken});
    });
}

export const login = CatchAsyncError(async (req : Request, res : Response) => {
    const { email } = req.body as Pick<TModifiedStudent, 'email'>;
    const activationToken = await loginService(email.toLowerCase());
    res.status(200).json({success : true, activationToken});
});

export const logout = CatchAsyncError(async (req : Request, res : Response) => {
    res.cookie('access_token', '', {maxAge : 1});
    res.cookie('refresh_token', '', {maxAge : 1});

    await deleteHashCache(`student:${req.student?.id}`);
    res.status(200).json({success : true, message : 'Logged out successfully'});
});

export const refreshToken = CatchAsyncError(async (req : Request, res : Response) => {
    const refresh_token : string = req.cookies['refresh_token'];
    const student : TSelectStudent = await refreshTokenService(refresh_token);

    req.student = student;
    const { accessToken } = await sendToken(student, res, 'refresh');
    res.status(200).json({success : true, accessToken});
});

export const socialAuth = CatchAsyncError(async (req : Request, res : Response) => {
    const { name, email, image } = req.body as Pick<TModifiedStudent, 'name' | 'email' | 'image'>;
    const studentDetails = await socialAuthService(name!.toLowerCase(), email.toLowerCase(), image!);

    const { accessToken, sanitizedStudent  } = await sendToken(studentDetails, res, 'login');
    res.status(200).json({success : true, student : sanitizedStudent , accessToken});
});