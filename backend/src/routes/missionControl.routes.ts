import { Router } from "express";
import { MissionControlController } from "../controllers/missionControl.controller.js";
import { RegistrationController } from "../controllers/registration.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All mission control routes require authentication + mission_control role
router.use(authenticate, requireRole("mission_control"));

// List assigned missions
router.get("/missions", MissionControlController.getMissions);
router.get("/medical-allocations", MissionControlController.getMedicalAllocations);
router.put("/medical-allocations/:medicalOfficerId", MissionControlController.updateMedicalAllocation);
router.get("/directives", MissionControlController.getDirectives);
router.post("/directives", MissionControlController.issueDirective);
router.patch("/directives/:id", MissionControlController.updateDirective);

// Command overview + doctor assignment
router.get("/dashboard", MissionControlController.getDashboardSummary);
router.post("/assign-doctor", MissionControlController.assignDoctor);
router.post("/assign-mission", MissionControlController.assignMission);

// System Governance — crew directory, account revocation, registration window
router.get("/crew", RegistrationController.getCrew);
router.delete("/user/:userId", RegistrationController.deleteUser);
router.get("/registration", RegistrationController.getRegistrationState);
router.post("/registration/start", RegistrationController.startRegistration);
router.post("/registration/close", RegistrationController.closeRegistration);

// Mission-specific routes
router.get("/:missionId/overview", MissionControlController.getMissionOverview);
router.get("/:missionId/crew", MissionControlController.getMissionCrew);
router.get("/:missionId/alerts", MissionControlController.getMissionAlerts);
router.get("/:missionId/analytics", MissionControlController.getMissionAnalytics);

export default router;
