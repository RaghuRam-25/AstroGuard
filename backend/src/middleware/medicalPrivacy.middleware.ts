import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../utils/response.js";
import { canAccessRawMedicalData } from "../services/medicalAccess.service.js";

export const checkMedicalDataAccess = (paramName = "astronautId") => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const astronautId = req.params[paramName] || req.body?.[paramName] || req.query[paramName];
    if (!req.user || !astronautId) return errorResponse(res, "Medical data owner is required.", 400);
    if (!(await canAccessRawMedicalData(req.user, String(astronautId)))) return errorResponse(res, "Forbidden: raw medical data is limited to the astronaut and assigned Medical Officer.", 403);
    next();
  } catch (error) { next(error); }
};
