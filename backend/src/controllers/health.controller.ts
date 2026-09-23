import { Request, Response, NextFunction } from "express";
import { HealthService } from "../services/health.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class HealthController {
  /**
   * POST /api/health
   * Ingest health telemetry, run ML anomaly pipeline, baseline calculation, and alerts
   */
  public static async postHealthData(req: Request, res: Response, next: NextFunction) {
    try {
      let { astronautId, heartRate, spo2, sleep, activity, ecg, bloodPressure, coreTemperatureC, respirationRate, microgravityStressIndex, notes, source, timestamp } = req.body;

      // Never trust client-supplied astronautId for astronaut role
      if (req.user && req.user.role === "astronaut") {
        if (!req.user.astronautId) {
          req.user.astronautId = `AST-${req.user._id.toString().slice(-4).toUpperCase()}`;
          await req.user.save();
        }
        astronautId = req.user.astronautId;
      }

      if (!astronautId) {
        astronautId = "AST-001";
      }

      const result = await HealthService.ingestHealthData({
        astronautId,
        heartRate,
        spo2,
        sleep,
        activity,
        ecg,
        bloodPressure,
        coreTemperatureC,
        respirationRate,
        microgravityStressIndex,
        notes,
        source,
        timestamp,
      });

      return successResponse(res, result, 201, "Health data processed and analyzed successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/health/:astronautId
   * Retrieve historical health telemetry for an astronaut
   */
  public static async getAstronautHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

      const result = await HealthService.getHealthData(astronautId, { limit, page });
      return successResponse(res, result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/health/:astronautId/latest
   * Retrieve latest recorded health telemetry for an astronaut
   */
  public static async getLatestHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      const latest = await HealthService.getLatestHealthData(astronautId);

      if (!latest) {
        return errorResponse(res, `No telemetry data found for astronaut: ${astronautId}`, 404);
      }

      return successResponse(res, latest, 200);
    } catch (error) {
      next(error);
    }
  }
}
