import { Request, Response, NextFunction } from "express";
import { AnalysisService } from "../services/analysis.service.js";
import { HealthService } from "../services/health.service.js";
import { MLService } from "../services/ml.service.js";
import { AIChatService } from "../services/aiChat.service.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { ConsultationReportService } from "../services/consultationReport.service.js";
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

  /** POST /api/analysis/chat */
  public static async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const astronautId = req.user?.astronautId;
      const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
      if (!astronautId) return errorResponse(res, "Authenticated astronaut profile is required.", 400);
      if (!question) return errorResponse(res, "A question is required.", 400);
      const context = await AIChatService.buildContext(astronautId);
      await AIChatService.saveTurn(astronautId, "user", { text: question, voice: Boolean(req.body?.voice) });
      const response = await AIChatService.generate(question, context);
      const escalated = await AIChatService.escalateIfNeeded(astronautId, context);
      if (escalated && typeof response.answer === "string" && !response.answer.includes("Medical Officer has been pinged")) response.answer += "\n\n**Escalation:** Your assigned Medical Officer has been pinged through the mission alert channel.";
      await AIChatService.saveTurn(astronautId, "assistant", { text: response.answer, analysis: response.analysis, voice: Boolean(req.body?.voice) });
      return successResponse(res, { response, persisted: true, contextCapturedAt: new Date().toISOString() }, 200);
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/analysis/chat/history */
  public static async getChatHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const astronautId = req.user?.astronautId;
      if (!astronautId) return errorResponse(res, "Authenticated astronaut profile is required.", 400);
      const requestedLimit = Number.parseInt(String(req.query.limit || "80"), 10);
      const limit = Math.min(200, Math.max(1, Number.isFinite(requestedLimit) ? requestedLimit : 80));
      const messages = await ChatMessage.find({ astronautId }).sort({ createdAt: 1 }).limit(limit).lean();
      return successResponse(res, { messages }, 200);
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/ai/generate-summary */
  public static async generateSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const astronautId = req.user?.astronautId;
      if (!astronautId) return errorResponse(res, "Authenticated astronaut profile is required.", 400);
      const report = await ConsultationReportService.createFromChat(astronautId, req.body?.assignedDoctorId);
      return successResponse(res, { report }, 201, "Consultation report generated and routed to the assigned Medical Officer.");
    } catch (error) {
      next(error);
    }
  }
}
