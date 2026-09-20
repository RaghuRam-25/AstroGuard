import { Router } from "express";
import { AlertController } from "../controllers/alert.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  getAlertsSchema,
  getAstronautAlertsSchema,
  resolveAlertSchema,
} from "../validators/alert.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { checkAstronautAccess } from "../middleware/ownership.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Protect all alert routes with authentication
router.use(authenticate);

router.get("/", validateRequest(getAlertsSchema), AlertController.getAlerts);

router.get(
  "/:astronautId",
  validateRequest(getAstronautAlertsSchema),
  checkAstronautAccess("astronautId"),
  AlertController.getAstronautAlerts
);

router.post(
  "/:id/resolve",
  requireRole("medical_officer", "mission_control", "admin"),
  validateRequest(resolveAlertSchema),
  AlertController.resolveAlert
);

export default router;
