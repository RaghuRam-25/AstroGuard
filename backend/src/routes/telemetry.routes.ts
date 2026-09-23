import { Router } from "express";
import { TelemetryController } from "../controllers/telemetry.controller.js";
import { authenticate, optionalAuthenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Streaming endpoint (SSE) - authenticated and scoped to self, assigned doctor, or mission authority
router.get("/stream/:astronautId?", authenticate, TelemetryController.stream);

// Telemetry Ingestion endpoint (handles sensor IoT payloads)
router.post("/ingest", optionalAuthenticate, TelemetryController.ingest);

// Fetch latest telemetry for astronaut
router.get("/latest/:astronautId?", authenticate, TelemetryController.getLatest);

export default router;
