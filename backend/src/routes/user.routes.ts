import { Router } from "express";
import { RegistrationController } from "../controllers/registration.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.delete("/:userId", authenticate, requireRole("mission_control"), RegistrationController.deleteUser);

export default router;
