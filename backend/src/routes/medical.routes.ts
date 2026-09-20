import { Router } from "express";
import { MedicalController } from "../controllers/medical.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All medical routes require authentication + medical_officer role
router.use(authenticate, requireRole("medical_officer"));

// Crew list with latest health summaries
router.get("/crew", MedicalController.getCrew);

// All crew alerts (across all assigned astronauts)
router.get("/alerts", MedicalController.getAllCrewAlerts);

// Individual crew member routes
router.get("/crew/:astronautId", MedicalController.getCrewMember);
router.get("/crew/:astronautId/health", MedicalController.getCrewMemberHealth);
router.get("/crew/:astronautId/analysis", MedicalController.getCrewMemberAnalysis);
router.get("/crew/:astronautId/alerts", MedicalController.getCrewMemberAlerts);

export default router;
