import { Router } from "express";
import { RegistrationController } from "../controllers/registration.controller.js";

const router = Router();

router.get("/registration-status", RegistrationController.getStatus);

export default router;
