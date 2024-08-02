import { Router } from 'express';
import { cancelPayment, checkout, verifyPayment } from '../controllers/checkout.controller';
import { isAuthenticated } from '../middlewares/auth';

const router : Router = Router();

router.post('/checkout/:courseId', isAuthenticated, checkout);

router.get('/verify', verifyPayment);

router.get('/cancel', cancelPayment);

export default router;