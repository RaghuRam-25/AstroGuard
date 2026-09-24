import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import astronautRoutes from "./routes/astronaut.routes.js";
import healthRoutes from "./routes/health.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import medicalRoutes from "./routes/medical.routes.js";
import missionControlRoutes from "./routes/missionControl.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import nutritionRoutes from "./routes/nutrition.routes.js";
import medicalCommunicationRoutes from "./routes/medicalCommunication.routes.js";
import clinicalOperationsRoutes from "./routes/clinicalOperations.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import telemetryRoutes from "./routes/telemetry.routes.js";
import registrationRoutes from "./routes/registration.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import publicRoutes from "./routes/public.routes.js";
import userRoutes from "./routes/user.routes.js";
import missionRoutes from "./routes/mission.routes.js";
import { successResponse } from "./utils/response.js";

const app: Application = express();

// 1. Security & Standard Middlewares
app.use(helmet());
app.use(cookieParser());

// CORS configuration (supports configured frontend URL + local Next.js dev + Vercel deployments)
const configuredFrontendOrigins = (env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const defaultAllowedOrigins = [
  ...configuredFrontendOrigins,
  "https://astro-guard-liart.vercel.app",
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const cleanOrigin = origin.trim().replace(/\/+$/, "");
      if (
        defaultAllowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "x-refresh-token",
      "x-request-id",
      "Accept",
      "Accept-Language",
    ],
    exposedHeaders: ["set-cookie"],
  })
);

// Body Parsers
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// General Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use("/api/", limiter);

// 2. Base Public Health Check Route
app.get("/health", (req: Request, res: Response) => {
  return successResponse(res, {
    status: "ONLINE",
    service: "AstroGuard Secure Backend API",
    version: "2.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 3. API Routes Mount
app.use("/api/auth", authRoutes);
app.use("/api/astronauts", astronautRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/telemetry", telemetryRoutes);
app.use("/api/medical-communication", medicalCommunicationRoutes);
app.use("/api/v1/chat", medicalCommunicationRoutes);
app.use("/api/clinical-operations", clinicalOperationsRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/upload", uploadRoutes);

// v1 compatibility routes (for requests hitting /api/v1/...)
app.use("/api/v1/telemetry", telemetryRoutes);
app.use("/api/v1/nutrition", nutritionRoutes);
app.use("/api/v1/alerts", alertRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/public", publicRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/missions", missionRoutes);

// Role-specific scoped APIs
app.use("/api/medical", medicalRoutes);
app.use("/api/v1/medical", medicalRoutes);
app.use("/api/mission-control", missionControlRoutes);
app.use("/api/v1/mission-control", missionControlRoutes);

// Public registration window gate (open/closed status + expiry)
app.use("/api/registration", registrationRoutes);

// 4. 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
