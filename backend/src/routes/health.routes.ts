import { Router } from "express";
import { HealthController } from "../controllers/health.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { createHealthDataSchema, getAstronautHealthSchema } from "../validators/health.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { checkMedicalDataAccess } from "../middleware/medicalPrivacy.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();
router.use(authenticate);

router.post(
  "/",
  requireRole("astronaut"),
  validateRequest(createHealthDataSchema),
  checkMedicalDataAccess("astronautId"),
  HealthController.postHealthData
);

router.get(
  "/:astronautId/latest",
  validateRequest(getAstronautHealthSchema),
  checkMedicalDataAccess("astronautId"),
  HealthController.getLatestHealth
);

router.get(
  "/:astronautId",
  validateRequest(getAstronautHealthSchema),
  checkMedicalDataAccess("astronautId"),
  HealthController.getAstronautHealth
);

export default router;
