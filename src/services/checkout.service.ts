import type Stripe from 'stripe';
import { stripe } from '../configs/stripe.config';
import { getAllHashCache, insertHashCache } from '../database/cache/index.cache';
import { findPurchase, insertPurchase } from '../database/queries/checkout.query';
import { AlreadyPurchasedError, BadRequestError, ResourceNotFoundError } from '../libs/utils';
import ErrorHandler from '../libs/utils/errorHandler';
import type { TErrorHandler, ModifiedPurchase, TSelectCourse, TSelectPurchases, PaymentIntent } from '../types/index.type';

export const checkoutService = async (currentStudentId : string, courseId : string) : Promise<string | null> => {
    try {
        const isAlreadyPurchase : ModifiedPurchase | undefined = await findPurchase(courseId, currentStudentId, 'modified');
        if(isAlreadyPurchase) throw new AlreadyPurchasedError();

        const desiredCourse : TSelectCourse = await getAllHashCache(`course:${courseId}`);
        if(!desiredCourse) throw new ResourceNotFoundError();

        const paymentUrl : string | null = await createCheckoutSession(desiredCourse, currentStudentId);
        return paymentUrl;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}

export const createCheckoutSession = async (desiredCourse : TSelectCourse, currentStudentId : string) : Promise<string | null> => {
    const checkoutSession : Stripe.Response<Stripe.Checkout.Session> = await stripe.checkout.sessions.create({
        line_items : [{
            price_data : {currency : 'usd', product_data : {
                name : desiredCourse.title, description : desiredCourse.description!, images : [desiredCourse.image!]
            }, unit_amount : desiredCourse.price! * 100}, quantity : 1
        }],
        mode : 'payment', payment_method_types : ['card'],
        success_url : `${process.env.STRIPE_SUCCESS_URL}/verify?session_id={CHECKOUT_SESSION_ID}&course_id=${desiredCourse.id}&Student_id=${currentStudentId}`,
        cancel_url : `${process.env.STRIPE_CANCEL_URL}/cancel`,
    });
    return checkoutSession.url;
}

export const verifyPaymentService = async (checkoutSessionId : string, courseId : string, currentStudentId : string) : Promise<TSelectPurchases> => {
    try {
        const verifySessionId : unknown = await stripe.checkout.sessions.retrieve(checkoutSessionId, 
            {expand : ['payment_intent.payment_method']}
        );
        const session : PaymentIntent = verifySessionId as PaymentIntent;
        if(!verifySessionId || !checkoutSessionId || !courseId || !currentStudentId) throw new BadRequestError();

        const { brand, last4, exp_month, exp_year } = session.payment_intent?.payment_method.card ?? {};
        const { id } = session.payment_intent?.payment_method ?? {}
        const purchaseDetail = <Omit<TSelectPurchases, 'id'>>{brand, card : last4, expMonth : exp_month, expYear : exp_year, 
            courseId, studentId : currentStudentId, paymentId : id
        }

        const newPurchase : TSelectPurchases = await insertPurchase(purchaseDetail);
        await Promise.all([insertHashCache(`purchase_detail:${newPurchase.id}`, newPurchase),
            insertHashCache(`Student_purchases:${currentStudentId}`, {[courseId] : newPurchase.id})
        ])
        return newPurchase;
        
    } catch (err : unknown) {
        const error = err as TErrorHandler;
        throw new ErrorHandler(`An error occurred : ${error.message}`, error.statusCode);
    }
}