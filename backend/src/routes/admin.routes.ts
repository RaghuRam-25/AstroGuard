import { Router } from "express";
import { RegistrationController } from "../controllers/registration.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(authenticate, requireRole("mission_control"));
router.post("/registration-toggle", RegistrationController.toggleRegistration);

export default router;
