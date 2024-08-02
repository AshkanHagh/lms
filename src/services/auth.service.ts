import { getAllHashCache } from '../database/cache/index.cache';
import { insertStudentDetails, selectWithCondition } from '../database/queries/student.query';
import { emailEvent } from '../events/email.event';
import { EmailAlreadyExists, InvalidEmailError, InvalidVerifyCode, LoginRequiredError, TokenRefreshError } from '../libs/utils';
import { generateActivationToken, verifyActivationToken } from '../libs/utils/activation-token';
import ErrorHandler from '../libs/utils/errorHandler';
import { decodeRefreshToken } from '../libs/utils/jwt';
import type { TErrorHandler, TModifiedStudent, TSelectStudent, TVerifyActivationToken } from '../types/index.type';

export const registerService = async (email : string) : Promise<string> => {
    try {
        const isEmailExists : Pick<TModifiedStudent, 'email'> = await selectWithCondition(email, 'emailOnly');
        if(isEmailExists) throw new EmailAlreadyExists();

        const student : Partial<TModifiedStudent> = {email};
        const {activationCode, activationToken} = generateActivationToken(student);

        emailEvent.emit('activation-email', email, activationCode);
        return activationToken;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const verifyAccountService = async <T extends 'login' | 'register'>(activationToken : string, activationCode : string, service : T) :
 Promise<TSelectStudent>=> {
    try {
        const {activationCode : code, student} : TVerifyActivationToken = verifyActivationToken(activationToken);
        if(code !== activationCode) throw new InvalidVerifyCode();

        const { email } = student;
        const desiredStudent : TSelectStudent = await selectWithCondition(email, 'fullData');

        if(service === 'register') {
            if(desiredStudent) throw new EmailAlreadyExists();
            const insertResult : TSelectStudent = await insertStudentDetails({email});
            return insertResult
        }
        return desiredStudent;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const loginService = async (email : string) => {
    try {
        const isStudentExists : Pick<TModifiedStudent, 'email'> = await selectWithCondition(email, 'emailOnly');
        if(!isStudentExists) throw new InvalidEmailError();

        const {activationCode, activationToken} = generateActivationToken(isStudentExists);
        emailEvent.emit('activation-email', email, activationCode);

        return activationToken;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const refreshTokenService = async (refreshToken : string) : Promise<TSelectStudent> => {
    try {
        const decodedToken = decodeRefreshToken(refreshToken);
        if(!decodeRefreshToken) throw new LoginRequiredError();

        const studentCache : TSelectStudent = await getAllHashCache(`student:${decodedToken.id}`);
        if(!studentCache || Object.keys(studentCache).length == 0) throw new TokenRefreshError();
        return studentCache
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const socialAuthService = async (name : string, email : string, image : string) : Promise<TSelectStudent> => {
    try {
        const desiredStudent : TSelectStudent = await selectWithCondition(email, 'fullData');
        if(desiredStudent) return desiredStudent;

        const studentDetails : TSelectStudent = await insertStudentDetails({name, email, image});
        return studentDetails
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}