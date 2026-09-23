import { Router } from "express";
import { NutritionController } from "../controllers/nutrition.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();
router.use(authenticate);

router.get("/me", requireRole("astronaut"), NutritionController.getMine);
router.post("/scan-meal", requireRole("astronaut"), NutritionController.scanMeal);
router.get("/intake", requireRole("astronaut"), NutritionController.getIntake);
router.get("/prescription", requireRole("astronaut"), NutritionController.getPrescription);
router.get("/prescription/:astronautId", NutritionController.getPrescription);

export default router;
