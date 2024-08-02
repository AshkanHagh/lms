import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth';
import { updatePersonalInformation } from '../controllers/dashboard.controller';

const router : Router = Router();

router.patch('/information', isAuthenticated, updatePersonalInformation);

export default router;