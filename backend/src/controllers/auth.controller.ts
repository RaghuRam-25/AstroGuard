import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User, IUser } from "../models/User.js";
import { Astronaut } from "../models/Astronaut.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} from "../utils/token.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { UploadService } from "../services/upload.service.js";
import { RegistrationController } from "./registration.controller.js";

const formatUserResponse = (user: IUser) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role,
  astronautId: user.astronautId,
  nasaBadgeId: user.nasaBadgeId,
  phone: user.phone,
  dateOfBirth: user.dateOfBirth,
  country: user.country,
  gender: user.gender,
  profileImage: user.profileImage,
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
      if (!(await RegistrationController.isRegistrationOpen())) {
        return errorResponse(res, "Public registration is currently closed. Please wait for Mission Control to open a registration window.", 403);
      }

      const {
        name,
        email,
        username,
        password,
        role = "astronaut",
        astronautId,
        nasaBadgeId,
        phone,
        dateOfBirth,
        country,
        gender,
        profileImage,
      } = req.body;

      // Check if email already registered
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return errorResponse(res, "An account with this email already exists.", 409);
      }

      const existingUsername = await User.findOne({ username: username.toLowerCase() });
      if (existingUsername) {
        return errorResponse(res, "This username is already taken.", 409);
      }

      // Hash password
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const finalAstronautId =
        role === "astronaut"
          ? astronautId || `AST-${Math.floor(100 + Math.random() * 900)}`
          : astronautId || undefined;

      let finalProfileImage = profileImage || undefined;
      if (profileImage && typeof profileImage === "string" && (profileImage.startsWith("data:") || profileImage.startsWith("http"))) {
        try {
          const uploadRes = await UploadService.uploadImage(profileImage, "astroguard/profiles");
          if (uploadRes?.url) {
            finalProfileImage = uploadRes.url;
          }
        } catch (uploadErr: any) {
          console.warn("Could not upload profile image to Cloudinary, keeping fallback:", uploadErr.message);
        }
      }

      // Create new user with selected role
      const user = await User.create({
        name,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        role,
        astronautId: finalAstronautId,
        nasaBadgeId: nasaBadgeId || (role === "astronaut" ? finalAstronautId : undefined),
        phone,
        dateOfBirth: new Date(dateOfBirth),
        country,
        gender: gender || undefined,
        profileImage: finalProfileImage,
        isActive: true,
      });

      if (role === "astronaut" && finalAstronautId) {
        await Astronaut.findOneAndUpdate(
          { astronautId: finalAstronautId },
          {
            astronautId: finalAstronautId,
            name,
            role: "Astronaut",
            mission: "Ares Mission 01",
            missionDay: 142,
            missionPhase: "Transit",
            status: "Active",
            avatar: finalProfileImage || "AM",
          },
          { upsert: true, new: true }
        );
      }

      // Generate Tokens & Cookies
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      setAuthCookies(res, accessToken, refreshToken);

      return successResponse(
        res,
        { user: formatUserResponse(user), accessToken, refreshToken },
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
      const identifier = String(email).trim();
      const normalizedIdentifier = identifier.toLowerCase();

      // Find user with passwordHash
      const user = await User.findOne({
        $or: [
          { email: normalizedIdentifier },
          { username: normalizedIdentifier },
          { astronautId: identifier },
          { nasaBadgeId: identifier.toUpperCase() },
        ],
      }).select("+passwordHash");
      if (!user) {
        // Generic message for security
        return errorResponse(res, "Invalid login ID or password credentials.", 401);
      }

      if (!user.isActive) {
        return errorResponse(res, "This account is inactive. Contact the mission administrator.", 403);
      }

      // Compare password
      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return errorResponse(res, "Invalid login ID or password credentials.", 401);
      }

      // Generate Tokens & Cookies
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      setAuthCookies(res, accessToken, refreshToken);

      return successResponse(
        res,
        { user: formatUserResponse(user), accessToken, refreshToken },
        200,
        "Login successful"
      );
    } catch (error) {
      console.error("[auth.login] Authentication request failed", {
        error,
        requestId: req.headers["x-request-id"],
      });
      return errorResponse(res, "Unable to complete login. Please try again later.", 500);
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
   * Refresh access token using refresh token in body, header, or cookie
   */
  public static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken =
        req.body?.refreshToken ||
        (req.headers["x-refresh-token"] as string) ||
        req.cookies?.astro_refresh;

      if (!refreshToken) {
        console.warn(
          `[auth.refresh] refresh token missing -> 401 | ${req.method} ${req.path} | hasAccessCookie=${Boolean(req.cookies?.astro_token)}`
        );
        return errorResponse(res, "Refresh token missing.", 401);
      }

      let payload: { id: string };
      try {
        payload = verifyRefreshToken(refreshToken);
      } catch (err) {
        console.warn(
          `[auth.refresh] invalid/expired refresh token -> 401 | ${req.method} ${req.path} | category=${String((err as any)?.name || "unknown")}`
        );
        clearAuthCookies(res);
        return errorResponse(res, "Invalid or expired refresh token.", 401);
      }

      const user = await User.findById(payload.id);
      if (!user || !user.isActive) {
        console.warn(`[auth.refresh] user missing/inactive -> 401 | ${req.method} ${req.path}`);
        clearAuthCookies(res);
        return errorResponse(res, "User not found or inactive.", 401);
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      setAuthCookies(res, newAccessToken, newRefreshToken);

      return successResponse(
        res,
        { user: formatUserResponse(user), accessToken: newAccessToken, refreshToken: newRefreshToken },
        200,
        "Token refreshed successfully"
      );
    } catch (error) {
      next(error);
    }
  }
}
