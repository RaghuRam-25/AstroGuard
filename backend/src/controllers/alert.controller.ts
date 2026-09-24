import { Request, Response, NextFunction } from "express";
import { AlertService } from "../services/alert.service.js";
import { Alert } from "../models/Alert.js";
import { Astronaut } from "../models/Astronaut.js";
import { assignedAstronautIdsForDoctor } from "../services/medicalAccess.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class AlertController {
  public static async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const severity = req.query.severity as string | undefined;
      const resolved = req.query.resolved !== undefined ? req.query.resolved === "true" : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const user = req.user!;

      let astronautIds: string[] | undefined;
      if (user.role === "astronaut") {
        astronautIds = user.astronautId ? [user.astronautId] : [];
      } else if (user.role === "medical_officer" && req.query.scope !== "all") {
        astronautIds = await assignedAstronautIdsForDoctor(user);
      }

      let alerts = await AlertService.getAlerts({ severity, resolved, limit });

      if (user.role === "medical_officer" && req.query.scope !== "all" && astronautIds && astronautIds.length) {
        alerts = alerts.filter(
          (a) => astronautIds!.includes(a.astronautId) || (a.severity === "Critical" && a.signal === "EMERGENCY_SOS")
        );
      } else if (user.role === "astronaut" && user.astronautId) {
        alerts = alerts.filter((a) => a.astronautId === user.astronautId);
      }

      return successResponse(res, alerts, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async getAstronautAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const alerts = await AlertService.getAlertsByAstronaut(req.params.astronautId);
      return successResponse(res, alerts, 200);
    } catch (error) {
      next(error);
    }
  }

  public static async createEmergency(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      if (user.role !== "astronaut" || !user.astronautId) {
        return errorResponse(res, "Only an authenticated astronaut can trigger Emergency SOS.", 403);
      }
      const reason = String(req.body?.reason || "Unspecified emergency").trim();
      const allowed = ["Extreme Dizziness", "Acute Pain", "Breathing Issue", "Disorientation"];
      if (!allowed.includes(reason)) {
        return errorResponse(res, "Unsupported emergency reason.", 400);
      }

      // Prevent duplicate emergency submissions within 30 seconds
      const recentDuplicate = await Alert.findOne({
        astronautId: user.astronautId,
        signal: "EMERGENCY_SOS",
        value: reason,
        resolved: false,
        createdAt: { $gt: new Date(Date.now() - 30 * 1000) },
      });
      if (recentDuplicate) {
        return successResponse(res, recentDuplicate, 200, "Emergency SOS already active.");
      }

      const ast = await Astronaut.findOne({ astronautId: user.astronautId });
      const missionName = ast?.mission || (user.missionIds && user.missionIds[0]) || "Ares Mission 01";

      const alert = await AlertService.createAlert({
        astronautId: user.astronautId,
        title: `EMERGENCY SOS — ${reason}`,
        description: `Critical emergency signal initiated by ${user.name} on ${missionName}. Immediate medical and mission-control review required.`,
        severity: "Critical",
        signal: "EMERGENCY_SOS",
        value: reason,
        baseline: "N/A",
      });

      return successResponse(res, alert, 201, "Emergency SOS transmitted to Medical Operations and Mission Control.");
    } catch (error) {
      next(error);
    }
  }

  public static async resolveAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const alert = await AlertService.resolveAlert(id);
      if (!alert) {
        return errorResponse(res, `Alert not found with ID: ${id}`, 404);
      }
      return successResponse(res, alert, 200, "Alert marked as resolved");
    } catch (error) {
      next(error);
    }
  }
}
