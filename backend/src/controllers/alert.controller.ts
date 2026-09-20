import { Request, Response, NextFunction } from "express";
import { AlertService } from "../services/alert.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class AlertController {
  /**
   * GET /api/alerts
   * List alerts across all astronauts with optional filters
   */
  public static async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const severity = req.query.severity as string | undefined;
      const resolved = req.query.resolved !== undefined ? req.query.resolved === "true" : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const user = req.user;
      let astronautFilter: any = undefined;

      if (user && user.role === "astronaut") {
        astronautFilter = user.astronautId;
      }

      const query: any = {};
      if (severity && severity !== "All") {
        query.severity = severity;
      }
      if (typeof resolved === "boolean") {
        query.resolved = resolved;
      }
      if (astronautFilter) {
        query.astronautId = astronautFilter;
      } else if (user && user.role === "medical_officer" && user.assignedAstronautIds && user.assignedAstronautIds.length > 0) {
        query.astronautId = { $in: user.assignedAstronautIds };
      }

      const alerts = await AlertService.getAlerts({ severity, resolved, limit });
      const filteredAlerts = alerts.filter((a) => {
        if (user?.role === "astronaut") {
          return a.astronautId === user.astronautId;
        }
        if (user?.role === "medical_officer" && user.assignedAstronautIds && user.assignedAstronautIds.length > 0) {
          return user.assignedAstronautIds.includes(a.astronautId);
        }
        return true;
      });

      return successResponse(res, filteredAlerts, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/alerts/:astronautId
   * List alerts for a specific astronaut
   */
  public static async getAstronautAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      const alerts = await AlertService.getAlertsByAstronaut(astronautId);
      return successResponse(res, alerts, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/alerts/:id/resolve
   * Mark an alert as resolved
   */
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
