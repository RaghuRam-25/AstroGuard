import { Request, Response, NextFunction } from "express";
import { Mission } from "../models/Mission.js";
import { Astronaut } from "../models/Astronaut.js";
import { HealthData } from "../models/HealthData.js";
import { Analysis } from "../models/Analysis.js";
import { Alert } from "../models/Alert.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class MissionControlController {
  /**
   * GET /api/mission-control/missions
   * List all missions assigned to this Mission Control user.
   */
  public static async getMissions(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const missionIds = user.missionIds || [];
      let query: any = {};
      if (missionIds.length > 0) {
        query = {
          $or: [{ name: { $in: missionIds } }, { missionId: { $in: missionIds } }],
        };
      }

      const missions = await Mission.find(query).sort({ createdAt: -1 });
      return successResponse(res, { missions }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mission-control/:missionId/overview
   * High-level mission status: crew count, health distribution, mission metadata.
   */
  public static async getMissionOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { missionId } = req.params;
      const user = req.user!;

      // Find mission (by missionId field OR name for backwards compat)
      const mission = await Mission.findOne({
        $or: [{ missionId }, { name: missionId }],
      });

      if (!mission) {
        return errorResponse(res, `Mission not found: ${missionId}`, 404);
      }

      // Enforce that this MC user is assigned to this mission
      const userMissionIds = user.missionIds || [];
      const hasAccess =
        userMissionIds.includes(mission.name) ||
        userMissionIds.includes(mission.missionId);
      if (!hasAccess) {
        return errorResponse(res, `Forbidden: You are not assigned to mission '${missionId}'.`, 403);
      }

      // Get all astronauts in this mission
      const astronauts = await Astronaut.find({ mission: mission.name });
      const astronautIds = astronauts.map((a) => a.astronautId);

      // Aggregate latest analysis for each astronaut
      const analyses = await Promise.all(
        astronautIds.map((id) =>
          Analysis.findOne({ astronautId: id })
            .sort({ createdAt: -1 })
            .select("astronautId anomalyScore riskLevel confidence createdAt")
        )
      );

      const validAnalyses = analyses.filter(Boolean);
      const distribution = {
        Normal: 0,
        Watch: 0,
        Warning: 0,
        Critical: 0,
      };
      validAnalyses.forEach((a) => {
        if (a) {
          const rawRisk = a.riskLevel as string;
          const displayLevel = (rawRisk === "Low" ? "Normal" : rawRisk) as keyof typeof distribution;
          if (displayLevel in distribution) {
            distribution[displayLevel]++;
          } else {
            distribution.Normal++;
          }
        }
      });

      const activeAlerts = await Alert.countDocuments({
        astronautId: { $in: astronautIds },
        resolved: false,
      });

      return successResponse(
        res,
        {
          mission,
          crewSize: astronauts.length,
          distribution,
          activeAlerts,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mission-control/:missionId/crew
   * All crew members with latest health summaries (mission-level view, not full medical).
   */
  public static async getMissionCrew(req: Request, res: Response, next: NextFunction) {
    try {
      const { missionId } = req.params;
      const user = req.user!;

      const mission = await Mission.findOne({
        $or: [{ missionId }, { name: missionId }],
      });

      if (!mission) {
        return errorResponse(res, `Mission not found: ${missionId}`, 404);
      }

      const userMissionIds = user.missionIds || [];
      if (
        !userMissionIds.includes(mission.name) &&
        !userMissionIds.includes(mission.missionId)
      ) {
        return errorResponse(res, `Forbidden: Not assigned to mission '${missionId}'.`, 403);
      }

      const astronauts = await Astronaut.find({ mission: mission.name }).sort({ name: 1 });

      const crew = await Promise.all(
        astronauts.map(async (ast) => {
          const [latestAnalysis, unresolvedAlerts] = await Promise.all([
            Analysis.findOne({ astronautId: ast.astronautId })
              .sort({ createdAt: -1 })
              .select("anomalyScore riskLevel createdAt"),
            Alert.countDocuments({ astronautId: ast.astronautId, resolved: false }),
          ]);

          return {
            astronautId: ast.astronautId,
            name: ast.name,
            role: ast.role,
            missionDay: ast.missionDay,
            missionPhase: ast.missionPhase,
            status: ast.status,
            avatar: ast.avatar,
            riskLevel: latestAnalysis?.riskLevel || "Low",
            anomalyScore: latestAnalysis?.anomalyScore || 0,
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
   * GET /api/mission-control/:missionId/alerts
   * All active alerts for the mission.
   */
  public static async getMissionAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { missionId } = req.params;
      const user = req.user!;

      const mission = await Mission.findOne({
        $or: [{ missionId }, { name: missionId }],
      });

      if (!mission) {
        return errorResponse(res, `Mission not found: ${missionId}`, 404);
      }

      const userMissionIds = user.missionIds || [];
      if (
        !userMissionIds.includes(mission.name) &&
        !userMissionIds.includes(mission.missionId)
      ) {
        return errorResponse(res, `Forbidden: Not assigned to mission '${missionId}'.`, 403);
      }

      const astronauts = await Astronaut.find({ mission: mission.name }).select("astronautId");
      const astronautIds = astronauts.map((a) => a.astronautId);

      const alerts = await Alert.find({
        astronautId: { $in: astronautIds },
      }).sort({ createdAt: -1 });

      return successResponse(res, alerts, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mission-control/:missionId/analytics
   * Anomaly score trends, risk distribution, mission analytics.
   */
  public static async getMissionAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { missionId } = req.params;
      const user = req.user!;

      const mission = await Mission.findOne({
        $or: [{ missionId }, { name: missionId }],
      });

      if (!mission) {
        return errorResponse(res, `Mission not found: ${missionId}`, 404);
      }

      const userMissionIds = user.missionIds || [];
      if (
        !userMissionIds.includes(mission.name) &&
        !userMissionIds.includes(mission.missionId)
      ) {
        return errorResponse(res, `Forbidden: Not assigned to mission '${missionId}'.`, 403);
      }

      const astronauts = await Astronaut.find({ mission: mission.name }).select("astronautId name");
      const astronautIds = astronauts.map((a) => a.astronautId);

      // Last 14 days of analyses per astronaut (anomaly trend)
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      const recentAnalyses = await Analysis.find({
        astronautId: { $in: astronautIds },
        createdAt: { $gte: fourteenDaysAgo },
      })
        .sort({ createdAt: 1 })
        .select("astronautId anomalyScore riskLevel createdAt");

      // Risk distribution
      const latestByAstronaut = await Promise.all(
        astronautIds.map((id) =>
          Analysis.findOne({ astronautId: id })
            .sort({ createdAt: -1 })
            .select("astronautId anomalyScore riskLevel")
        )
      );

      const riskDistribution = { Normal: 0, Watch: 0, Warning: 0, Critical: 0 };
      latestByAstronaut.filter(Boolean).forEach((a) => {
        if (a) {
          const level = a.riskLevel === "Low" ? "Normal" : a.riskLevel;
          if (level in riskDistribution) {
            riskDistribution[level as keyof typeof riskDistribution]++;
          } else {
            riskDistribution.Normal++;
          }
        }
      });

      // Alert summary
      const alertSummary = await Alert.aggregate([
        { $match: { astronautId: { $in: astronautIds } } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]);

      return successResponse(
        res,
        {
          mission,
          recentAnalyses,
          riskDistribution,
          alertSummary,
          crewCount: astronauts.length,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }
}
