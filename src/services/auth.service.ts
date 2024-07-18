import { getAllHashCache } from '../database/cache/index.cache';
import { insertAuthInfo, selectWithCondition } from '../database/queries/user.query';
import { emailEvent } from '../events/email.event';
import { EmailAlreadyExists, InvalidEmailError, InvalidVerifyCode, LoginRequiredError, TokenRefreshError } from '../libs/utils';
import { generateActivationToken, verifyActivationToken } from '../libs/utils/activation-token';
import ErrorHandler from '../libs/utils/errorHandler';
import { decodeRefreshToken } from '../libs/utils/jwt';
import type { TErrorHandler, TModifiedUser, TSelectUser, TVerifyActivationToken } from '../types/index.type';

export const registerService = async (email : string) : Promise<string> => {
    try {
        const isEmailExists : Pick<TModifiedUser, 'email'> = await selectWithCondition(email, 'emailOnly');
        if(isEmailExists) throw new EmailAlreadyExists();

        const user : Partial<TModifiedUser> = {email};
        const {activationCode, activationToken} = generateActivationToken(user);

        emailEvent.emit('activation-email', email, activationCode);
        return activationToken;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const verifyAccountService = async <T extends 'login' | 'register'>(activationToken : string, activationCode : string, service : T) :
 Promise<TSelectUser>=> {
    try {
        const {activationCode : code, user} : TVerifyActivationToken = verifyActivationToken(activationToken);
        if(code !== activationCode) throw new InvalidVerifyCode();

        const { email } = user;
        const desiredUser : TSelectUser = await selectWithCondition(email, 'fullData');

        if(service === 'register') {
            if(desiredUser) throw new EmailAlreadyExists();
            const insertResult : TSelectUser = await insertAuthInfo({email});
            return insertResult
        }
        return desiredUser;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const loginService = async (email : string) => {
    try {
        const isUserExists : Pick<TModifiedUser, 'email'> = await selectWithCondition(email, 'emailOnly');
        if(!isUserExists) throw new InvalidEmailError();

        const {activationCode, activationToken} = generateActivationToken(isUserExists);
        emailEvent.emit('activation-email', email, activationCode);

        return activationToken;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const refreshTokenService = async (refreshToken : string) : Promise<TSelectUser> => {
    try {
        const decodedToken = decodeRefreshToken(refreshToken);
        if(!decodeRefreshToken) throw new LoginRequiredError();

        const userCache : TSelectUser = await getAllHashCache(`user:${decodedToken.id}`);
        if(!userCache || Object.keys(userCache).length == 0) throw new TokenRefreshError();
        return userCache
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const socialAuthService = async (name : string, email : string, image : string) : Promise<TSelectUser> => {
    try {
        const desiredUser : TSelectUser = await selectWithCondition(email, 'fullData');
        if(desiredUser) return desiredUser;

        const userDetails : TSelectUser = await insertAuthInfo({name, email, image});
        return userDetails
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}