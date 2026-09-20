import { Router } from "express";
import { HealthController } from "../controllers/health.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  createHealthDataSchema,
  getAstronautHealthSchema,
} from "../validators/health.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { checkAstronautAccess } from "../middleware/ownership.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Protect all health routes with authentication
router.use(authenticate);

router.post(
  "/",
  requireRole("astronaut", "admin"),
  validateRequest(createHealthDataSchema),
  checkAstronautAccess("astronautId"),
  HealthController.postHealthData
);

router.get(
  "/:astronautId/latest",
  validateRequest(getAstronautHealthSchema),
  checkAstronautAccess("astronautId"),
  HealthController.getLatestHealth
);

router.get(
  "/:astronautId",
  validateRequest(getAstronautHealthSchema),
  checkAstronautAccess("astronautId"),
  HealthController.getAstronautHealth
);

export default router;
