import { Router } from 'express';
import { authorizedRoles, isAuthenticated } from '../middlewares/auth';
import { course, courseBenefit, createCourse, createCourseChapter, editCourseDetails, updateChapterVideoDetail, 
updateCourseChapter } from '../controllers/course.controller';
import { isCourseExists } from '../middlewares/checkItemExists';
import { validationMiddleware } from '../middlewares/validation';
import { createCourseSchema, editCourseDetailsSchema, courseBenefitSchema, insertChapterBodySchema, updateCourseChapterSchema, updateChapterVideoDetailSchema } from '../validations/Joi';

const router : Router = Router();

router.post('/', [validationMiddleware(createCourseSchema), isAuthenticated, authorizedRoles('admin', 'teacher')], createCourse);

router.patch('/:courseId', [validationMiddleware(editCourseDetailsSchema), isAuthenticated, authorizedRoles('admin', 'teacher'), 
    isCourseExists('teacher_mode')], editCourseDetails
);

router.post('/benefit/:courseId', [validationMiddleware(courseBenefitSchema), isAuthenticated, authorizedRoles('admin', 'teacher'), 
    isCourseExists('teacher_mode')], courseBenefit
);

router.post('/chapter/:courseId', [validationMiddleware(insertChapterBodySchema), isAuthenticated, authorizedRoles('admin', 'teacher'), 
    isCourseExists('teacher_mode')], createCourseChapter
);

router.patch('/chapter/:courseId/:chapterId', [validationMiddleware(updateCourseChapterSchema), isAuthenticated, 
    authorizedRoles('admin', 'teacher'), isCourseExists('teacher_mode')], updateCourseChapter
);

router.patch('/chapter/video/:chapterId/:videoId', [validationMiddleware(updateChapterVideoDetailSchema), isAuthenticated, 
    authorizedRoles('admin', 'teacher')], updateChapterVideoDetail
);

router.get('/:courseId', [isAuthenticated, isCourseExists('normal')], course);

export default router;