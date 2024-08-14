import { Router } from 'express';
import { cancelPayment, checkout, subscriptionCheckout, subscriptionPortal, verifyPayment, 
    webhookEventListener } from '../controllers/checkout.controller';
import { isAuthenticated } from '../middlewares/auth';
import { isCourseExists } from '../middlewares/checkItemExists';
import { validateParams, validateQuery } from '../middlewares/validation';
import express from 'express';
import { CheckoutVerifyQuerySchema, courseParamsSchema, querySchema } from '../validations/Joi';

const router : Router = Router();

router.post('/checkout/:courseId', [validateParams(courseParamsSchema), isAuthenticated, isCourseExists('normal')], checkout);

router.get('/verify', validateQuery(CheckoutVerifyQuerySchema), verifyPayment);

router.get('/cancel', cancelPayment);

router.post('/webhooks/stripe', express.raw({type: 'application/json'}), webhookEventListener);

router.post('/subscription', [isAuthenticated, validateQuery(querySchema)], subscriptionCheckout);

router.get('/subscription/portal', isAuthenticated, subscriptionPortal);

export default router;