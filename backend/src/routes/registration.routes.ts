import { Router } from "express";
import { RegistrationController } from "../controllers/registration.controller.js";

const router = Router();

// Public, read-only registration gate — consumed by the public Navbar / register page.
router.get("/status", RegistrationController.getStatus);

export default router;