import { Request, Response, NextFunction } from "express";
import { TelemetryService, telemetryEvents } from "../services/telemetry.service.js";
import { Astronaut } from "../models/Astronaut.js";
import { canDoctorManageAstronaut } from "../services/medicalAccess.service.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { env } from "../config/env.js";

export class TelemetryController {
  private static async canReadTelemetry(req: Request, astronautId: string) {
    const user = req.user;
    if (!user) return false;
    if (user.role === "astronaut") return user.astronautId === astronautId;
    if (user.role === "medical_officer") return canDoctorManageAstronaut(user, astronautId);
    if (user.role === "mission_control") {
      const missionIds = user.missionIds || [];
      const astronaut = await Astronaut.findOne({ astronautId }).select("mission").lean();
      return Boolean(astronaut && (!missionIds.length || missionIds.includes(astronaut.mission)));
    }
    return false;
  }
  /**
   * POST /api/telemetry/ingest
   * Ingest biometric telemetry data from automated IoT feeds
   */
  static async ingest(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body;
      if (!payload) {
        return errorResponse(res, "Missing telemetry payload.", 400);
      }

      // Handle array or single object
      if (Array.isArray(payload)) {
        const results = [];
        for (const item of payload) {
          if (item.astronautId && item.heartRate && item.spo2) {
            const saved = await TelemetryService.ingestTelemetry(item);
            results.push(saved);
          }
        }
        return successResponse(res, { ingestedCount: results.length, data: results }, 201, "Batch telemetry ingested.");
      }

      if (!payload.astronautId) {
        payload.astronautId = req.user?.astronautId;
      }

      if (!payload.astronautId || !payload.heartRate || !payload.spo2) {
        return errorResponse(res, "astronautId, heartRate, and spo2 are required fields.", 400);
      }

      const result = await TelemetryService.ingestTelemetry(payload);
      return successResponse(res, { telemetry: result }, 201, "Telemetry synced successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/telemetry/latest/:astronautId
   */
  static async getLatest(req: Request, res: Response, next: NextFunction) {
    try {
      const astronautId = req.params.astronautId || req.user?.astronautId;
      if (!astronautId) {
        return errorResponse(res, "Astronaut ID is required.", 400);
      }
      if (!(await TelemetryController.canReadTelemetry(req, astronautId))) {
        return errorResponse(res, "Telemetry access denied for this astronaut.", 403);
      }

      const data = await TelemetryService.getLatest(astronautId);
      return successResponse(res, { telemetry: data }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/telemetry/stream/:astronautId
   * Server-Sent Events (SSE) real-time streaming endpoint
   */
  static async stream(req: Request, res: Response) {
    const astronautId = req.params.astronautId || (req.user as any)?.astronautId;
    if (!astronautId) {
      return errorResponse(res, "Astronaut ID is required.", 400);
    }
    if (!(await TelemetryController.canReadTelemetry(req, astronautId))) {
      return errorResponse(res, "Telemetry access denied for this astronaut.", 403);
    }

    // Set SSE Headers
    const requestOrigin = req.get("origin");
    const allowedOrigins = [
      ...env.FRONTEND_URL.split(",").map((origin) => origin.trim()).filter(Boolean),
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
    ];
    const allowOrigin = requestOrigin && allowedOrigins.includes(requestOrigin) ? requestOrigin : "*";

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Credentials": "true",
    });

    // Send initial ping/connection confirmation
    res.write(`event: connected\ndata: ${JSON.stringify({ status: "CONNECTED", astronautId, syncHz: 100 })}\n\n`);

    // Send latest initial state
    try {
      const latest = await TelemetryService.getLatest(astronautId);
      res.write(`event: telemetry\ndata: ${JSON.stringify(latest)}\n\n`);
    } catch (err) {
      // Ignore initial fetch error
    }

    // Listener for new events from TelemetryService or IoT Simulator
    const eventKey = `telemetry:${astronautId}`;
    const listener = (data: any) => {
      res.write(`event: telemetry\ndata: ${JSON.stringify(data)}\n\n`);
    };

    telemetryEvents.on(eventKey, listener);

    // Keep-alive heartbeat interval every 15s
    const heartbeat = setInterval(() => {
      res.write(": keep-alive\n\n");
    }, 15000);

    // Clean up on disconnect
    req.on("close", () => {
      clearInterval(heartbeat);
      telemetryEvents.off(eventKey, listener);
      res.end();
    });
  }
}
