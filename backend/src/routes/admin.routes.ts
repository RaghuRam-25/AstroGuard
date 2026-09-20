import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireRole("admin"));

// ─── Users ──────────────────────────────────
router.get("/users", AdminController.getUsers);
router.post("/users", AdminController.createUser);
router.put("/users/:id", AdminController.updateUser);
router.patch("/users/:id/status", AdminController.updateUserStatus);
router.patch("/users/:id/role", AdminController.updateUserRole);

// ─── Missions ───────────────────────────────
router.get("/missions", AdminController.getMissions);
router.post("/missions", AdminController.createMission);
router.put("/missions/:id", AdminController.updateMission);
router.post("/missions/:id/assign-astronaut", AdminController.assignAstronaut);
router.post("/missions/:id/assign-medical-officer", AdminController.assignMedicalOfficer);
router.post("/missions/:id/assign-mission-control", AdminController.assignMissionControl);

// ─── Audit Logs ─────────────────────────────
router.get("/audit-logs", AdminController.getAuditLogs);

// ─── System Status ──────────────────────────
router.get("/system-status", AdminController.getSystemStatus);

export default router;
