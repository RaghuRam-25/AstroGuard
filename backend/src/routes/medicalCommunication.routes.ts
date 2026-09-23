import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { MedicalCommunicationController } from "../controllers/medicalCommunication.controller.js";

const router = Router();
router.use(authenticate, requireRole("astronaut", "medical_officer"));
router.get("/peers", MedicalCommunicationController.getPeers);
router.get("/messages", MedicalCommunicationController.getMessages);
router.post("/messages", MedicalCommunicationController.sendMessage);
router.patch("/messages/read", MedicalCommunicationController.markRead);
router.get("/calls", MedicalCommunicationController.getCalls);
router.post("/calls", MedicalCommunicationController.createCall);
export default router;
