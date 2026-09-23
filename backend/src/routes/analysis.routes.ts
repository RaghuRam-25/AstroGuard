import { Router } from "express";
import { AnalysisController } from "../controllers/analysis.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  triggerAnalysisSchema,
  getAstronautAnalysisSchema,
} from "../validators/analysis.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { checkMedicalDataAccess } from "../middleware/medicalPrivacy.middleware.js";

const router = Router();

// Protect all analysis routes
router.use(authenticate);

router.post("/chat", AnalysisController.chat);
router.get("/chat/history", AnalysisController.getChatHistory);

router.post(
  "/",
  validateRequest(triggerAnalysisSchema),
  checkMedicalDataAccess("astronautId"),
  AnalysisController.triggerAnalysis
);

router.get(
  "/:astronautId/latest",
  validateRequest(getAstronautAnalysisSchema),
  checkMedicalDataAccess("astronautId"),
  AnalysisController.getLatestAnalysis
);

router.get(
  "/:astronautId/history",
  validateRequest(getAstronautAnalysisSchema),
  checkMedicalDataAccess("astronautId"),
  AnalysisController.getAnalysisHistory
);

export default router;
