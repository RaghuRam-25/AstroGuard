import { Request, Response, NextFunction } from "express";
import { UserRole } from "../models/User.js";
import { errorResponse } from "../utils/response.js";

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, "Authentication required.", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Forbidden: Role '${req.user.role}' does not have permission for this resource.`,
        403
      );
    }

    next();
  };
};
