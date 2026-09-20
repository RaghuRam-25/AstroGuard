import { Router } from "express";
import { AstronautController } from "../controllers/astronaut.controller.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  createAstronautSchema,
  getAstronautByIdSchema,
} from "../validators/astronaut.validator.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { checkAstronautAccess } from "../middleware/ownership.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Protect all astronaut routes
router.use(authenticate);

router.get("/", AstronautController.getAstronauts);

router.get(
  "/:id",
  validateRequest(getAstronautByIdSchema),
  checkAstronautAccess("id"),
  AstronautController.getAstronautById
);

router.post(
  "/",
  requireRole("admin"),
  validateRequest(createAstronautSchema),
  AstronautController.createAstronaut
);

router.put(
  "/:id",
  requireRole("admin", "medical_officer"),
  validateRequest(getAstronautByIdSchema),
  checkAstronautAccess("id"),
  AstronautController.updateAstronaut
);

router.delete(
  "/:id",
  requireRole("admin"),
  validateRequest(getAstronautByIdSchema),
  AstronautController.deleteAstronaut
);

export default router;
