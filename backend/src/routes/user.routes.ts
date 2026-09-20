import { Router } from "express";
import { UserController } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  getUserByIdSchema,
} from "../validators/user.validator.js";

const router = Router();

// Protect all user routes for admin only
router.use(authenticate, requireRole("admin"));

router.get("/", UserController.getUsers);
router.get("/:id", validateRequest(getUserByIdSchema), UserController.getUserById);
router.post("/", validateRequest(createUserSchema), UserController.createUser);
router.patch("/:id", validateRequest(updateUserSchema), UserController.updateUser);
router.delete("/:id", validateRequest(getUserByIdSchema), UserController.deleteUser);

export default router;
