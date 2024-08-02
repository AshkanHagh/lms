import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth';
import { course, courseBenefit, createCourse, createCourseChapter, editCourseDetails } from '../controllers/course.controller';

const router : Router = Router();

router.post('/', isAuthenticated, createCourse);

router.patch('/:courseId', isAuthenticated, editCourseDetails);

router.post('/benefit/:courseId', isAuthenticated, courseBenefit);

router.post('/chapter/:courseId', isAuthenticated, createCourseChapter);

router.get('/:courseId', isAuthenticated, course);

export default router;