import { Router } from 'express';
import { login, logout, refreshToken, register, socialAuth, verifyAccount } from '../controllers/auth.controller';
import { validationMiddleware } from '../middlewares/validation';
import { authValidation, socialAuthValidation, verifyAccountValidation } from '../validations/Joi';
import { isAuthenticated } from '../middlewares/auth';

const router : Router = Router();

router.post('/register', validationMiddleware(authValidation), register);

router.post('/register/verify', validationMiddleware(verifyAccountValidation), verifyAccount('register'));

router.post('/login', validationMiddleware(authValidation), login);

router.post('/login/verify', validationMiddleware(verifyAccountValidation), verifyAccount('login'));

router.post('/social', validationMiddleware(socialAuthValidation), socialAuth);

router.get('/logout', isAuthenticated, logout);

router.get('/refresh', refreshToken);

export default router;