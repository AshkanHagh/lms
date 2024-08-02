import { insertHashCache } from '../database/cache/index.cache';
import { updateInformation } from '../database/queries/user.query';
import ErrorHandler from '../libs/utils/errorHandler';
import type { TErrorHandler, TSelectStudent, UpdateAccount } from '../types/index.type';

export const updatePersonalInformationService = async (currentUser : TSelectStudent, names : UpdateAccount) => {
    try {
        names.firstName = names.firstName ?? currentUser.name?.split(' ')[0];
        names.lastName = names.lastName ?? currentUser.name?.split(' ')[1];
        const fullName : string = `${names.firstName} ${names.lastName}`;

        const updatedName = await updateInformation(fullName, currentUser.id);
        await insertHashCache(`user:${currentUser.id}`, updatedName);
        return {firstName : updatedName.name?.split(' ')[0], lastName : updatedName.name?.split(' ')[1]}
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}