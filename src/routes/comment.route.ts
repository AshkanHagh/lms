import { Router } from 'express';
import { isAuthenticated } from '../middlewares/auth';
import { validateParams, validateQuery, validationMiddleware } from '../middlewares/validation';
import { courseAndCommentIdSchema, courseParamsSchema, paginationQuerySchema, rateCourseSchema, sendCommentSchema } from '../validations/Joi';
import { courseComments, courseRateDetail, deleteComment, rateCourse, sendComment, updateComment } from '../controllers/comment.controller';

const router = Router();

router.post('/rate/:courseId', isAuthenticated, [validationMiddleware(rateCourseSchema), validateParams(courseParamsSchema)], rateCourse);

router.get('/rate/:courseId', validateParams(courseParamsSchema), courseRateDetail);

router.post('/:courseId', isAuthenticated, [validateParams(courseParamsSchema), validationMiddleware(sendCommentSchema)], sendComment);

router.patch('/:courseId/:commentId', isAuthenticated, validateParams(courseAndCommentIdSchema), updateComment);

router.delete('/:courseId/:commentId', isAuthenticated, validateParams(courseAndCommentIdSchema), deleteComment);

router.get('/:courseId', [validateParams(courseParamsSchema), validateQuery(paginationQuerySchema)], courseComments);

export default router;