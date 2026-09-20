import { Router } from "express";
import { MissionControlController } from "../controllers/missionControl.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All mission control routes require authentication + mission_control role
router.use(authenticate, requireRole("mission_control"));

// List assigned missions
router.get("/missions", MissionControlController.getMissions);

// Mission-specific routes
router.get("/:missionId/overview", MissionControlController.getMissionOverview);
router.get("/:missionId/crew", MissionControlController.getMissionCrew);
router.get("/:missionId/alerts", MissionControlController.getMissionAlerts);
router.get("/:missionId/analytics", MissionControlController.getMissionAnalytics);

export default router;
