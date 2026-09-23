import { Router } from "express";
import { MissionControlController } from "../controllers/missionControl.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.post("/", authenticate, requireRole("mission_control"), MissionControlController.createMission);

export default router;
