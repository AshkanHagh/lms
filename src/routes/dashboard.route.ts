import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth';
import { browseCourses, transactionsList, updatePersonalInformation } from '../controllers/dashboard.controller';

const router : Router = Router();

router.patch('/information', isAuthenticated, updatePersonalInformation);

router.get('/transactions', isAuthenticated, transactionsList);

router.get('/browse', isAuthenticated, browseCourses);

export default router;