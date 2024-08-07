import { Router } from 'express';
import { cancelPayment, checkout, subscriptionCheckout, subscriptionPortal, verifyPayment, 
    webhookListening } from '../controllers/checkout.controller';
import { isAuthenticated } from '../middlewares/auth';
import { isCourseExists } from '../middlewares/checkItemExists';
import { validateQuery } from '../middlewares/validation';
import express from 'express';
import { querySchema } from '../validations/Joi';

const router : Router = Router();

router.post('/checkout/:courseId', [isAuthenticated, isCourseExists('normal')], checkout);

router.get('/verify', verifyPayment);

router.get('/cancel', cancelPayment);

router.post('/webhooks/stripe', express.raw({type: 'application/json'}), webhookListening);

router.post('/subscription', [isAuthenticated, validateQuery(querySchema)], subscriptionCheckout);

router.get('/subscription/portal', isAuthenticated, subscriptionPortal);

export default router;