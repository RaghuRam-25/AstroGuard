import { Router } from "express";
import { MedicalController } from "../controllers/medical.controller.js";
import { RecommendationController } from "../controllers/recommendation.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { NutritionController } from "../controllers/nutrition.controller.js";

const router = Router();

// All medical routes require authentication + medical_officer role
router.use(authenticate, requireRole("medical_officer"));

// Assigned astronaut management — strict roster scoping enforced in controller
router.get("/crew", MedicalController.getCrew);
router.get("/my-astronauts", MedicalController.getMyAstronauts);

// All crew alerts (across all assigned astronauts)
router.get("/alerts", MedicalController.getAllCrewAlerts);
router.get("/reports/:doctorId", MedicalController.getConsultationReports);
router.patch("/reports/:reportId", MedicalController.updateConsultationReport);
router.get("/prescriptions/:astronautId", NutritionController.getDoctorPlans);
router.patch("/prescriptions/:planId", NutritionController.updateDoctorPlan);

// AI / Doctor recommendation push → astronaut calm dashboard feed
router.post("/recommendations", RecommendationController.create);
router.get("/crew/:astronautId/recommendations", RecommendationController.listByAstronaut);

// Individual crew member routes
router.get("/crew/:astronautId", MedicalController.getCrewMember);
router.get("/crew/:astronautId/health", MedicalController.getCrewMemberHealth);
router.get("/crew/:astronautId/analysis", MedicalController.getCrewMemberAnalysis);
router.get("/crew/:astronautId/alerts", MedicalController.getCrewMemberAlerts);
router.get("/crew/:astronautId/reviews", MedicalController.getClinicalReviews);
router.post("/crew/:astronautId/reviews", MedicalController.createClinicalReview);

export default router;
