import { Router } from 'express';
import { authorizedRoles, isAuthenticated } from '../middlewares/auth';
import { course, courseBenefit, createCourse, createCourseChapter, editCourseDetails, updateChapterVideoDetail, 
updateCourseChapter } from '../controllers/course.controller';

const router : Router = Router();

router.post('/', [isAuthenticated, authorizedRoles('admin', 'teacher')], createCourse);

router.patch('/:courseId', [isAuthenticated, authorizedRoles('admin', 'teacher')], editCourseDetails);

router.post('/benefit/:courseId', [isAuthenticated, authorizedRoles('admin', 'teacher')], courseBenefit);

router.post('/chapter/:courseId', [isAuthenticated, authorizedRoles('admin', 'teacher')], createCourseChapter);

router.patch('/chapter/:courseId/:chapterId', [isAuthenticated, authorizedRoles('admin', 'teacher')], updateCourseChapter);

router.patch('/chapter/video/:chapterId/:videoId', [isAuthenticated, authorizedRoles('admin', 'teacher')], updateChapterVideoDetail);

router.get('/:courseId', isAuthenticated, course);

export default router;