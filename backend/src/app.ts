import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import astronautRoutes from "./routes/astronaut.routes.js";
import healthRoutes from "./routes/health.routes.js";
import analysisRoutes from "./routes/analysis.routes.js";
import alertRoutes from "./routes/alert.routes.js";
import medicalRoutes from "./routes/medical.routes.js";
import missionControlRoutes from "./routes/missionControl.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { successResponse } from "./utils/response.js";

const app: Application = express();

// 1. Security & Standard Middlewares
app.use(helmet());
app.use(cookieParser());

// CORS configuration (supports configured frontend URL + localhost)
const allowedOrigins = [
  env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive fallback
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
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
app.use("/api/users", userRoutes);
app.use("/api/astronauts", astronautRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/alerts", alertRoutes);

// Role-specific scoped APIs
app.use("/api/medical", medicalRoutes);
app.use("/api/mission-control", missionControlRoutes);
app.use("/api/admin", adminRoutes);

// 4. 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
