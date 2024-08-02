import type { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../middlewares/catchAsyncError';
import { checkoutService, verifyPaymentService } from '../services/checkout.service';
import type { CompletePaymentQueries } from '../types/index.type';

export const checkout = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { courseId } = req.params as {courseId : string};
        const currentStudentId : string = req.student!.id;

        const paymentUrl : string | null = await checkoutService(currentStudentId, courseId);
        res.status(200).json({success : true, url : paymentUrl});

    } catch (error : unknown) {
        return next(error);
    }
});

export const verifyPayment = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { session_id, course_id, student_id } = req.query as CompletePaymentQueries;
        const verifiedPurchase = await verifyPaymentService(session_id, course_id, student_id);

        res.status(200).json({success : true, purchase : verifiedPurchase});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const cancelPayment = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        res.status(200).json({success : true, message : 'Purchase was canceled successfully'});
        
    } catch (error : unknown) {
        return next(error);
    }
});