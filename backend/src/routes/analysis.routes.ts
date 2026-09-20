import { Router } from "express";
import { AnalysisController } from "../controllers/analysis.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  triggerAnalysisSchema,
  getAstronautAnalysisSchema,
} from "../validators/analysis.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { checkAstronautAccess } from "../middleware/ownership.middleware.js";

const router = Router();

// Protect all analysis routes
router.use(authenticate);

router.post(
  "/",
  validateRequest(triggerAnalysisSchema),
  checkAstronautAccess("astronautId"),
  AnalysisController.triggerAnalysis
);

router.get(
  "/:astronautId/latest",
  validateRequest(getAstronautAnalysisSchema),
  checkAstronautAccess("astronautId"),
  AnalysisController.getLatestAnalysis
);

router.get(
  "/:astronautId/history",
  validateRequest(getAstronautAnalysisSchema),
  checkAstronautAccess("astronautId"),
  AnalysisController.getAnalysisHistory
);

export default router;
