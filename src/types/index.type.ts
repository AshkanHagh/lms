import type { InferSelectModel } from 'drizzle-orm';
import type { userTable } from '../database/schema';

export type TErrorHandler = {
    statusCode : number; message : string
}

export type TActivationToken = {
    activationCode : string; activationToken : string;
}

export type TVerifyActivationToken = {
    user : TModifiedUser; activationCode : string;
}

export type TVerifyAccount = {
    activationCode : string; activationToken : string;
}

export type TSelectUser = InferSelectModel<typeof userTable>;
export type TModifiedUser = Omit<TSelectUser, 'customerId'>;

export type TUserResultClient = Omit<TSelectUser, 'updatedAt' | 'createdAt' | 'customerId'>;

export type TCookieOptions = {
    expires : Date; maxAge : number, httpOnly : boolean; sameSite : 'lax' | 'strict' | 'none'; secure? : boolean;
}

export type TInsertCache<T> = {
    [field : string] : T
}

export type TSendToken = {
    accessToken : string; others : TUserResultClient;
}

export type TokenResponse<T> = T extends 'refresh' ? {accessToken : string} : TSendToken;
export type SelectCondition<T> = T extends 'emailOnly' ? Pick<TModifiedUser, 'email'> : TSelectUser

declare module 'express-serve-static-core' {
    interface Request {
        user? : TSelectUser;
    }
}