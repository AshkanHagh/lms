import { Router } from "express";
import { authorizedRoles, isAuthenticated } from "../middlewares/auth";
import {
  browseCourses,
  courseAnalysis,
  teacherCourses,
  transactionsList,
  updatePersonalInformation,
} from "../controllers/dashboard.controller";

const router: Router = Router();

router.patch("/information", isAuthenticated, updatePersonalInformation);

router.get("/transactions", isAuthenticated, transactionsList);

router.get("/browse", isAuthenticated, browseCourses);

router.get(
  "/analytics",
  isAuthenticated,
  authorizedRoles("teacher"),
  courseAnalysis,
);

router.get(
  "/courses",
  isAuthenticated,
  authorizedRoles("teacher"),
  teacherCourses,
);

export default router;
