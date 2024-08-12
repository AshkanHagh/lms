import type { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../middlewares/catchAsyncError';
import type { CoursesProgress, TransactionResult, TSelectStudent, UpdateAccount } from '../types/index.type';
import { browseCoursesService, transactionsListService, updatePersonalInformationService } from '../services/dashboard.service';

export const updatePersonalInformation = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { firstName, lastName } = req.body as UpdateAccount;
        const student : TSelectStudent = req.student!

        const {firstName : updatedFirstName, lastName : updatedLastName } = 
        await updatePersonalInformationService(student, {firstName, lastName});
        res.status(200).json({success : true, firstName : updatedFirstName, lastName : updatedLastName});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const transactionsList = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const currentStudentId : string = req.student!.id;
        const { modifiedPurchase, subscriptionDetail } : TransactionResult = await transactionsListService(currentStudentId);
        res.status(200).json({success : true, transactions : modifiedPurchase, subscription : subscriptionDetail});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const browseCourses = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const currentStudentId : string = req.student!.id;
        const courses : CoursesProgress[] = await browseCoursesService(currentStudentId);
        res.status(200).json({success : true, courses});
        
    } catch (error : unknown) {
        return next(error);
    }
});