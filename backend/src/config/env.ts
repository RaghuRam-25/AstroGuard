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
  AI_API_BASE_URL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("gpt-5-mini"),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  CLOUDINARY_URL: z.string().optional().default(""),
}).superRefine((env, ctx) => {
  if (!env.MONGODB_URI.startsWith("mongodb://") && !env.MONGODB_URI.startsWith("mongodb+srv://")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["MONGODB_URI"],
      message: "MONGODB_URI must be a valid MongoDB connection string starting with mongodb:// or mongodb+srv://",
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
