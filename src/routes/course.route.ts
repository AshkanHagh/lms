import { Router } from 'express';
import { authorizedRoles, isAuthenticated } from '../middlewares/auth';
import { courseDetails, courseBenefit, courseChapterDetails, createCourse, createCourseChapter, editCourseDetails, updateChapterVideoDetail, 
updateCourseChapter, courseVideosDetail, markAsCompleted, courseStateDetail,
courses,
mostUsedTags} from '../controllers/course.controller';
import { isCourseExists } from '../middlewares/checkItemExists';
import { validateParams, validationMiddleware } from '../middlewares/validation';
import { createCourseSchema, editCourseDetailsSchema, courseBenefitSchema, insertChapterBodySchema, updateCourseChapterSchema, updateChapterVideoDetailSchema, courseParamsSchema, courseAndChapterIdSchema, chapterAndVideoIdSchema, markAsCompletedSchema, courseAndVideoIdSchema } from '../validations/Joi';

const router : Router = Router();

router.get('/tags', mostUsedTags);

router.post('/', [validationMiddleware(createCourseSchema), isAuthenticated, authorizedRoles('admin', 'teacher')], createCourse);

router.patch('/:courseId', [validationMiddleware(editCourseDetailsSchema), validateParams(courseParamsSchema), isAuthenticated, 
    authorizedRoles('admin', 'teacher'), isCourseExists('teacher_mode')], editCourseDetails);

router.post('/benefit/:courseId', [validationMiddleware(courseBenefitSchema), validateParams(courseParamsSchema), isAuthenticated,
    authorizedRoles('admin', 'teacher'), isCourseExists('teacher_mode')], courseBenefit);

router.post('/chapter/:courseId', [validationMiddleware(insertChapterBodySchema), validateParams(courseParamsSchema), isAuthenticated, 
    authorizedRoles('admin', 'teacher'), isCourseExists('teacher_mode')], createCourseChapter);

router.patch('/chapter/:courseId/:chapterId', [validationMiddleware(updateCourseChapterSchema), validateParams(courseAndChapterIdSchema), 
    isAuthenticated, authorizedRoles('admin', 'teacher'), isCourseExists('teacher_mode')], updateCourseChapter
);

router.patch('/chapter/video/:chapterId/:videoId', [validationMiddleware(updateChapterVideoDetailSchema), 
    validateParams(chapterAndVideoIdSchema), isAuthenticated, authorizedRoles('admin', 'teacher')], updateChapterVideoDetail);

router.get('/:courseId', [validateParams(courseParamsSchema), isAuthenticated, isCourseExists('normal')], courseDetails);

router.get('/chapter/:courseId/:chapterId', [validateParams(courseAndChapterIdSchema), isAuthenticated, isCourseExists('normal')], 
    courseChapterDetails);

router.get('/chapter/video/:videoId/:chapterId', [validateParams(chapterAndVideoIdSchema), isAuthenticated], courseVideosDetail);

router.post('/state/:courseId/:videoId', [validationMiddleware(markAsCompletedSchema), validateParams(courseAndVideoIdSchema), 
    isAuthenticated, isCourseExists('normal')], markAsCompleted);

router.get('/state/:courseId', [validateParams(courseParamsSchema), isAuthenticated], courseStateDetail);

router.get('/', courses);

export default router;