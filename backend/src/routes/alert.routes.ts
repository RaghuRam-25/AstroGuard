import { Router } from "express";
import { AlertController } from "../controllers/alert.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { getAlertsSchema, getAstronautAlertsSchema, resolveAlertSchema } from "../validators/alert.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { checkAstronautAccess } from "../middleware/ownership.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();
router.use(authenticate);
router.post("/emergency", requireRole("astronaut"), AlertController.createEmergency);
router.get("/", requireRole("medical_officer", "mission_control"), validateRequest(getAlertsSchema), AlertController.getAlerts);
router.get("/:astronautId", requireRole("medical_officer", "mission_control"), validateRequest(getAstronautAlertsSchema), checkAstronautAccess("astronautId"), AlertController.getAstronautAlerts);
router.post("/:id/resolve", requireRole("medical_officer", "mission_control"), validateRequest(resolveAlertSchema), AlertController.resolveAlert);
export default router;
