import type { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../middlewares/catchAsyncError';
import type { TSelectStudent, UpdateAccount } from '../types/index.type';
import { updatePersonalInformationService } from '../services/dashboard.service';

export const updatePersonalInformation = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { firstName, lastName } = req.body as UpdateAccount;
        const {firstName : updatedFirstName, lastName : updatedLastName 
        } = await updatePersonalInformationService(req.student! as TSelectStudent, {firstName, lastName});

        res.status(200).json({success : true, firstName : updatedFirstName, lastName : updatedLastName});
        
    } catch (error : unknown) {
        return next(error);
    }
});