import jwt from "jsonwebtoken";
import { Response } from "express";
import { env } from "../config/env.js";
import { IUser, UserRole } from "../models/User.js";

export interface JwtUserPayload {
  id: string;
  email: string;
  role: UserRole;
  astronautId?: string;
  missionIds?: string[];
  assignedAstronautIds?: string[];
}

export const generateAccessToken = (user: IUser): string => {
  const payload: JwtUserPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    astronautId: user.astronautId,
    missionIds: user.missionIds,
    assignedAstronautIds: user.assignedAstronautIds,
  };

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

export const generateRefreshToken = (user: IUser): string => {
  return jwt.sign({ id: user._id.toString() }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any,
  });
};

export const verifyAccessToken = (token: string): JwtUserPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtUserPayload;
};

export const verifyRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as { id: string };
};

// SameSite policy:
// - Local development (localhost:3000 -> localhost:5000) is SAME-SITE, so "lax"
//   works and keeps dev simple (no Secure required over http).
// - Production (Vercel -> Render, different registrable domains) is CROSS-SITE.
//   Browsers will not send SameSite=Lax cookies on cross-site fetch() requests,
//   which silently breaks every protected API call and the refresh flow.
//   Cross-site cookies require SameSite=None AND Secure.
const cookieSameSite = (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax";

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken?: string
) => {
  const isProduction = env.NODE_ENV === "production";

  // Access Token Cookie (15 minutes)
  res.cookie("astro_token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: cookieSameSite,
    maxAge: 15 * 60 * 1000, // 15 min
    path: "/",
  });

  // Refresh Token Cookie (7 days)
  if (refreshToken) {
    res.cookie("astro_refresh", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: cookieSameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
  }
};

export const clearAuthCookies = (res: Response) => {
  const isProduction = env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: cookieSameSite,
    path: "/",
  };

  res.clearCookie("astro_token", cookieOptions);
  res.clearCookie("astro_refresh", cookieOptions);
};
