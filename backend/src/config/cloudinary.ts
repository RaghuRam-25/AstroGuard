import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

const isCloudinaryConfigured = Boolean(
  (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) ||
  env.CLOUDINARY_URL ||
  process.env.CLOUDINARY_URL
);

if (isCloudinaryConfigured) {
  if (env.CLOUDINARY_URL || process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloudinary_url: env.CLOUDINARY_URL || process.env.CLOUDINARY_URL,
    });
  } else {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
  console.log("☁️  Cloudinary Service Configured.");
} else {
  console.log("☁️  Cloudinary credentials not provided in .env (file upload fallback active).");
}

export { cloudinary, isCloudinaryConfigured };
