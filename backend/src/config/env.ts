import dotenv from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

const envSchema = z.object({
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required"),
  ML_SERVICE_URL: z.string().default("http://localhost:8000"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  JWT_SECRET: z.string().default(isProduction ? "" : "astroguard_jwt_super_secret_key_2025_secure_telemetry"),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_SECRET: z
    .string()
    .default(isProduction ? "" : "astroguard_refresh_token_super_secret_key_2025_deep_space"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("7d"),
}).superRefine((env, ctx) => {
  const lowerMongoUri = env.MONGODB_URI.toLowerCase();

  if (
    lowerMongoUri.includes("localhost") ||
    lowerMongoUri.includes("127.0.0.1") ||
    lowerMongoUri.includes("0.0.0.0")
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["MONGODB_URI"],
      message: "MONGODB_URI must point to MongoDB Atlas, not a local MongoDB server.",
    });
  }

  try {
    const dbName = new URL(env.MONGODB_URI).pathname.replace(/^\//, "").split("?")[0];
    if (dbName !== "AstroGuard") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["MONGODB_URI"],
        message: "MONGODB_URI must include the AstroGuard database.",
      });
    }
  } catch {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["MONGODB_URI"],
      message: "MONGODB_URI must be a valid MongoDB connection string.",
    });
  }

  if (env.NODE_ENV === "production") {
    (["JWT_SECRET", "REFRESH_TOKEN_SECRET"] as const).forEach((key) => {
      if (!env[key].trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required in production`,
        });
      }
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
