import type { Request, Response, NextFunction } from 'express';
import { CatchAsyncError } from '../middlewares/catchAsyncError';
import { checkoutService, subscriptionCheckoutService, subscriptionPortalService, verifyPaymentService, 
    webhookListeningService } from '../services/checkout.service';
import type { CompletePaymentQueries, TSelectPurchases, TSelectStudent } from '../types/index.type';
import { RequestTimedOutError } from '../libs/utils';

export const checkout = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { courseId } = req.params as {courseId : string};
        const currentStudent : TSelectStudent = req.student!;
        const timeout = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new RequestTimedOutError()), 3000);
        });

        const paymentUrl : string | null = await Promise.race([checkoutService(currentStudent, courseId), timeout]);
        res.status(200).json({success : true, url : paymentUrl});

    } catch (error : unknown) {
        return next(error);
    }
});

export const verifyPayment = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { session_id, course_id, student_id } = req.query as CompletePaymentQueries;
        const verifiedPurchase : TSelectPurchases = await verifyPaymentService(session_id, course_id, student_id);
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

export const webhookListening = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const signature : string | undefined = req.headers['stripe-signature'] as string | undefined;
        const body : string = req.body;

        const webhookResult : string = await webhookListeningService(signature, body);
        res.status(200).json({success : true, message : webhookResult});

    } catch (error : unknown) {
        return next(error);
    }
});

export const subscriptionCheckout = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const { plan } = req.query as {plan : 'monthly' | 'yearly'};
        const currentStudent : TSelectStudent = req.student!;
        const timeout = new Promise<string>((_, reject) => {
            setTimeout(() => reject(new RequestTimedOutError()), 3000);
        });
        
        const checkoutUrl : string | null = await Promise.race([subscriptionCheckoutService(plan, currentStudent), timeout]);
        res.status(200).json({success : true, checkoutUrl});
        
    } catch (error : unknown) {
        return next(error);
    }
});

export const subscriptionPortal = CatchAsyncError(async (req : Request, res : Response, next : NextFunction) => {
    try {
        const customerId : string | undefined = req.student?.customerId ?? undefined
        const portalUrl : string | null = await subscriptionPortalService(customerId);
        res.status(200).json({success : true, portalUrl});
        
    } catch (error : unknown) {
        return next(error);
    }
})