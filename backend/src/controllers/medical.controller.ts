import { Request, Response, NextFunction } from "express";
import { Astronaut } from "../models/Astronaut.js";
import { HealthData } from "../models/HealthData.js";
import { Analysis } from "../models/Analysis.js";
import { Alert } from "../models/Alert.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class MedicalController {
  /**
   * GET /api/medical/crew
   * Returns all astronauts assigned to this medical officer,
   * with their latest health telemetry and analysis summary.
   */
  public static async getCrew(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const assignedIds = user.assignedAstronautIds || [];

      let query: any = {};
      if (assignedIds.length > 0) {
        query.astronautId = { $in: assignedIds };
      }

      const astronauts = await Astronaut.find(query).sort({ name: 1 });

      // Enrich each astronaut with latest health + analysis
      const crew = await Promise.all(
        astronauts.map(async (ast) => {
          const [latestHealth, latestAnalysis, unresolvedAlerts] = await Promise.all([
            HealthData.findOne({ astronautId: ast.astronautId })
              .sort({ timestamp: -1 })
              .select("heartRate spo2 sleep activity timestamp"),
            Analysis.findOne({ astronautId: ast.astronautId })
              .sort({ createdAt: -1 })
              .select("anomalyScore riskLevel confidence createdAt"),
            Alert.countDocuments({ astronautId: ast.astronautId, resolved: false }),
          ]);

          return {
            astronautId: ast.astronautId,
            name: ast.name,
            role: ast.role,
            mission: ast.mission,
            missionDay: ast.missionDay,
            missionPhase: ast.missionPhase,
            status: ast.status,
            avatar: ast.avatar,
            latestHealth,
            latestAnalysis,
            unresolvedAlerts,
          };
        })
      );

      return successResponse(res, { crew, total: crew.length }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medical/crew/:astronautId
   * Full profile + latest vitals for a specific astronaut in this MO's roster.
   */
  public static async getCrewMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      const user = req.user!;

      // Enforce roster access
      const assignedIds = user.assignedAstronautIds || [];
      if (assignedIds.length > 0 && !assignedIds.includes(astronautId)) {
        return errorResponse(
          res,
          `Forbidden: Astronaut '${astronautId}' is not on your medical roster.`,
          403
        );
      }

      const astronaut = await Astronaut.findOne({ astronautId });
      if (!astronaut) {
        return errorResponse(res, `Astronaut not found: ${astronautId}`, 404);
      }

      const [latestHealth, latestAnalysis, unresolvedAlerts] = await Promise.all([
        HealthData.findOne({ astronautId }).sort({ timestamp: -1 }),
        Analysis.findOne({ astronautId }).sort({ createdAt: -1 }),
        Alert.countDocuments({ astronautId, resolved: false }),
      ]);

      return successResponse(
        res,
        { astronaut, latestHealth, latestAnalysis, unresolvedAlerts },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medical/crew/:astronautId/health
   * Full health history for a specific crew member.
   */
  public static async getCrewMemberHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      const user = req.user!;
      const assignedIds = user.assignedAstronautIds || [];

      if (assignedIds.length > 0 && !assignedIds.includes(astronautId)) {
        return errorResponse(
          res,
          `Forbidden: Astronaut '${astronautId}' is not on your medical roster.`,
          403
        );
      }

      const limit = parseInt((req.query.limit as string) || "50", 10);
      const page = parseInt((req.query.page as string) || "1", 10);
      const skip = (page - 1) * limit;

      const [records, total] = await Promise.all([
        HealthData.find({ astronautId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit),
        HealthData.countDocuments({ astronautId }),
      ]);

      return successResponse(res, { records, total, page, limit }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medical/crew/:astronautId/analysis
   * Analysis history for a specific crew member.
   */
  public static async getCrewMemberAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      const user = req.user!;
      const assignedIds = user.assignedAstronautIds || [];

      if (assignedIds.length > 0 && !assignedIds.includes(astronautId)) {
        return errorResponse(
          res,
          `Forbidden: Astronaut '${astronautId}' is not on your medical roster.`,
          403
        );
      }

      const latest = await Analysis.findOne({ astronautId }).sort({ createdAt: -1 });
      const history = await Analysis.find({ astronautId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("anomalyScore riskLevel confidence createdAt");

      return successResponse(res, { latest, history }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medical/crew/:astronautId/alerts
   * Alerts for a specific crew member.
   */
  public static async getCrewMemberAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      const user = req.user!;
      const assignedIds = user.assignedAstronautIds || [];

      if (assignedIds.length > 0 && !assignedIds.includes(astronautId)) {
        return errorResponse(
          res,
          `Forbidden: Astronaut '${astronautId}' is not on your medical roster.`,
          403
        );
      }

      const alerts = await Alert.find({ astronautId }).sort({ createdAt: -1 });
      return successResponse(res, alerts, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medical/alerts
   * All alerts across all assigned astronauts.
   */
  public static async getAllCrewAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const assignedIds = user.assignedAstronautIds || [];

      const query: any = assignedIds.length > 0 ? { astronautId: { $in: assignedIds } } : {};
      const alerts = await Alert.find(query).sort({ createdAt: -1 });
      return successResponse(res, alerts, 200);
    } catch (error) {
      next(error);
    }
  }
}
