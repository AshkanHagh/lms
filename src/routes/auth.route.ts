import { Router } from 'express';
import { login, logout, refreshToken, register, socialAuth, verifyAccount } from '../controllers/auth.controller';
import validationMiddleware from '../middlewares/validation.body';
import { authValidation, socialAuthValidation, verifyAccountValidation } from '../validations/Joi';
import { rateLimit } from '../middlewares/rate-limit';
import { isAuthenticated } from '../middlewares/auth';

const router : Router = Router();

router.post('/register', rateLimit(10), validationMiddleware(authValidation), register);

router.post('/register/verify', rateLimit(5), validationMiddleware(verifyAccountValidation), verifyAccount('register'));

router.post('/login', rateLimit(10), validationMiddleware(authValidation), login);

router.post('/login/verify', rateLimit(5), validationMiddleware(verifyAccountValidation), verifyAccount('login'));

router.post('/social', rateLimit(10), validationMiddleware(socialAuthValidation), socialAuth);

router.get('/logout', rateLimit(10), isAuthenticated, logout);

router.get('/refresh', rateLimit(1000), refreshToken);

export default router;