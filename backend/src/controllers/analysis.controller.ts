import { Request, Response, NextFunction } from "express";
import { AnalysisService } from "../services/analysis.service.js";
import { HealthService } from "../services/health.service.js";
import { MLService } from "../services/ml.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class AnalysisController {
  /**
   * POST /api/analysis
   * Trigger on-demand AI analysis for explicit vitals or latest saved telemetry
   */
  public static async triggerAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId, heartRate, spo2, sleep, activity } = req.body;

      let hr = heartRate;
      let ox = spo2;
      let sl = sleep;
      let ac = activity;

      // If vitals not fully provided, fetch from latest health reading
      if (hr === undefined || ox === undefined || sl === undefined || ac === undefined) {
        const latest = await HealthService.getLatestHealthData(astronautId);
        if (!latest) {
          return errorResponse(
            res,
            `No health telemetry available for astronaut ${astronautId}. Please supply metrics or ingest data first.`,
            400
          );
        }
        hr = hr ?? latest.heartRate;
        ox = ox ?? latest.spo2;
        sl = sl ?? latest.sleep;
        ac = ac ?? latest.activity;
      }

      const mlResult = await MLService.predictAnomaly({
        heartRate: hr,
        spo2: ox,
        sleep: sl,
        activity: ac,
      });

      const result = await AnalysisService.processAndSaveAnalysis({
        astronautId,
        heartRate: hr,
        spo2: ox,
        sleep: sl,
        activity: ac,
        mlResult,
      });

      return successResponse(res, result, 201, "Analysis computed successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analysis/:astronautId/latest
   * Retrieve the latest AI health analysis for an astronaut
   */
  public static async getLatestAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      const analysis = await AnalysisService.getLatestAnalysis(astronautId);

      if (!analysis) {
        return errorResponse(res, `No AI analysis records found for astronaut: ${astronautId}`, 404);
      }

      return successResponse(res, analysis, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/analysis/:astronautId/history
   * Retrieve historical AI analyses for an astronaut
   */
  public static async getAnalysisHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 30;

      const history = await AnalysisService.getAnalysisHistory(astronautId, limit);
      return successResponse(res, history, 200);
    } catch (error) {
      next(error);
    }
  }
}
