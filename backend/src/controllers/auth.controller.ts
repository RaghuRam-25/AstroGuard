import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User, IUser } from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "../utils/token.js";
import { successResponse, errorResponse } from "../utils/response.js";

const formatUserResponse = (user: IUser) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  astronautId: user.astronautId,
  assignedAstronautIds: user.assignedAstronautIds,
  missionIds: user.missionIds,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new restricted default account
   */
  public static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, astronautId } = req.body;

      // Check if email already registered
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return errorResponse(res, "An account with this email already exists.", 409);
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create new user (role locked to 'astronaut' for security)
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "astronaut",
        astronautId: astronautId || undefined,
        isActive: true,
      });

      // Generate Tokens & Cookies
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      setAuthCookies(res, accessToken, refreshToken);

      return successResponse(
        res,
        { user: formatUserResponse(user), accessToken },
        201,
        "Registration successful"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticate user, issue JWTs and HTTP-only cookies
   */
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      // Find user with passwordHash
      const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
      if (!user) {
        // Generic message for security
        return errorResponse(res, "Invalid email or password credentials.", 401);
      }

      if (!user.isActive) {
        return errorResponse(res, "This account is inactive. Contact the mission administrator.", 403);
      }

      // Compare password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return errorResponse(res, "Invalid email or password credentials.", 401);
      }

      // Generate Tokens & Cookies
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      setAuthCookies(res, accessToken, refreshToken);

      return successResponse(
        res,
        { user: formatUserResponse(user), accessToken },
        200,
        "Login successful"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Clear authentication cookies
   */
  public static async logout(req: Request, res: Response) {
    clearAuthCookies(res);
    return successResponse(res, { loggedOut: true }, 200, "Successfully logged out");
  }

  /**
   * GET /api/auth/me
   * Return current authenticated user
   */
  public static async getMe(req: Request, res: Response) {
    if (!req.user) {
      return errorResponse(res, "Unauthorized", 401);
    }
    return successResponse(res, { user: formatUserResponse(req.user) }, 200);
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token cookie
   */
  public static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.astro_refresh;
      if (!refreshToken) {
        return errorResponse(res, "Refresh token missing.", 401);
      }

      let payload: { id: string };
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch (err) {
        clearAuthCookies(res);
        return errorResponse(res, "Invalid or expired refresh token.", 401);
      }

      const user = await User.findById(payload.id);
      if (!user || !user.isActive) {
        clearAuthCookies(res);
        return errorResponse(res, "User not found or inactive.", 401);
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      setAuthCookies(res, newAccessToken, newRefreshToken);

      return successResponse(
        res,
        { user: formatUserResponse(user), accessToken: newAccessToken },
        200,
        "Token refreshed successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
