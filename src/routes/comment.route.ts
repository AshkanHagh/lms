import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth";
import {
  validateParams,
  validateQuery,
  validationMiddleware,
} from "../middlewares/validation";
import {
  commentParamsSchema,
  courseAndCommentIdSchema,
  courseParamsSchema,
  paginationQuerySchema,
  rateCourseSchema,
  replayAndCommentIdSchema,
  sendCommentSchema,
} from "../validations/Joi";
import {
  courseComments,
  courseRateDetail,
  deleteComment,
  rateCourse,
  removeReplay,
  repliesDetail,
  sendComment,
  sendReplay,
  updateComment,
  updateReplay,
} from "../controllers/comment.controller";

const router = Router();

router.post(
  "/rate/:courseId",
  [
    isAuthenticated,
    validationMiddleware(rateCourseSchema),
    validateParams(courseParamsSchema),
  ],
  rateCourse,
);

router.get(
  "/rate/:courseId",
  validateParams(courseParamsSchema),
  courseRateDetail,
);

router.post(
  "/:courseId",
  [
    isAuthenticated,
    validateParams(courseParamsSchema),
    validationMiddleware(sendCommentSchema),
  ],
  sendComment,
);

router.patch(
  "/:courseId/:commentId",
  [
    isAuthenticated,
    validateParams(courseAndCommentIdSchema),
    validationMiddleware(sendCommentSchema),
  ],
  updateComment,
);

router.delete(
  "/:courseId/:commentId",
  [isAuthenticated, validateParams(courseAndCommentIdSchema)],
  deleteComment,
);

router.get(
  "/:courseId",
  [validateParams(courseParamsSchema), validateQuery(paginationQuerySchema)],
  courseComments,
);

router.post(
  "/replies/:courseId/:commentId",
  [
    isAuthenticated,
    validateParams(courseAndCommentIdSchema),
    validationMiddleware(sendCommentSchema),
  ],
  sendReplay,
);

router.patch(
  "/replies/:replayId/:commentId",
  [
    isAuthenticated,
    validateParams(replayAndCommentIdSchema),
    validationMiddleware(sendCommentSchema),
  ],
  updateReplay,
);

router.delete(
  "/replies/:replayId/:commentId",
  [isAuthenticated, validateParams(replayAndCommentIdSchema)],
  removeReplay,
);

router.get(
  "/replies/:commentId",
  [validateParams(commentParamsSchema), validateQuery(paginationQuerySchema)],
  repliesDetail,
);

export default router;
