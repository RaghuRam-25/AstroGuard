import { Router } from "express";
import { AnalysisController } from "../controllers/analysis.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
router.use(authenticate);
router.post("/generate-summary", AnalysisController.generateSummary);
export default router;
