import { Request, Response, NextFunction } from "express";
import { Astronaut } from "../models/Astronaut.js";
import { errorResponse } from "../utils/response.js";

/**
 * Validates that the authenticated user has permission to access a specific astronaut's physiological data.
 */
export const checkAstronautAccess = (paramName: string = "astronautId") => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (!user) {
        return errorResponse(res, "Authentication required.", 401);
      }

      // Admin has universal system access
      if (user.role === "admin") {
        return next();
      }

      // Determine the target astronautId from params or body
      const targetAstronautId = req.params[paramName] || req.body[paramName] || req.query[paramName];

      if (!targetAstronautId) {
        return next();
      }

      // 1. Astronaut Role: Strict ownership check
      if (user.role === "astronaut") {
        if (!user.astronautId || user.astronautId !== targetAstronautId) {
          return errorResponse(
            res,
            `Forbidden: You are only authorized to access your own astronaut profile (${user.astronautId || "unassigned"}).`,
            403
          );
        }
        return next();
      }

      // 2. Medical Officer Role: Check assigned roster
      if (user.role === "medical_officer") {
        if (
          user.assignedAstronautIds &&
          user.assignedAstronautIds.length > 0 &&
          !user.assignedAstronautIds.includes(targetAstronautId)
        ) {
          return errorResponse(
            res,
            `Forbidden: Astronaut '${targetAstronautId}' is not assigned to your medical roster.`,
            403
          );
        }
        return next();
      }

      // 3. Mission Control Role: Check assigned mission
      if (user.role === "mission_control") {
        const astronautDoc = await Astronaut.findOne({ astronautId: targetAstronautId });
        if (astronautDoc && user.missionIds && user.missionIds.length > 0) {
          if (!user.missionIds.includes(astronautDoc.mission)) {
            return errorResponse(
              res,
              `Forbidden: Astronaut is in mission '${astronautDoc.mission}', not within your mission monitoring clearance.`,
              403
            );
          }
        }
        return next();
      }

      return next();
    } catch (error) {
      next(error);
    }
  };
};
