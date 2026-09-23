import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, JwtUserPayload } from "../utils/token.js";
import { User, IUser } from "../models/User.js";
import { errorResponse } from "../utils/response.js";

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      tokenPayload?: JwtUserPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.astro_token;

    // Also support Authorization header for cURL / API testing / mobile
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return errorResponse(res, "Authentication required. Please log in.", 401);
    }

    // Verify token
    let decoded: JwtUserPayload;
    try {
      decoded = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        return errorResponse(res, "Session expired. Please refresh or log in again.", 401);
      }
      return errorResponse(res, "Invalid authentication token.", 401);
    }

    // Find user in DB
    const user = await User.findById(decoded.id);
    if (!user) {
      return errorResponse(res, "User not found or account removed.", 401);
    }

    if (!user.isActive) {
      return errorResponse(res, "User account is suspended. Contact mission administrator.", 403);
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.astro_token;
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.id);
        if (user && user.isActive) {
          req.user = user;
          req.tokenPayload = decoded;
        }
      } catch {
        // Continue unauthenticated
      }
    }
    next();
  } catch {
    next();
  }
};

