import { cloudinary, isCloudinaryConfigured } from "../config/cloudinary.js";

export interface UploadResult {
  url: string;
  publicId?: string;
}

export class UploadService {
  /**
   * Upload an image (base64 data URI, file buffer, or remote URL) to Cloudinary.
   * If Cloudinary is not configured, returns the provided input as fallback.
   */
  public static async uploadImage(
    fileOrDataUri: string | Buffer,
    folder: string = "astroguard/avatars"
  ): Promise<UploadResult> {
    if (!isCloudinaryConfigured) {
      if (typeof fileOrDataUri === "string") {
        return { url: fileOrDataUri };
      }
      return { url: "" };
    }

    try {
      if (typeof fileOrDataUri === "string") {
        const result = await cloudinary.uploader.upload(fileOrDataUri, {
          folder,
          resource_type: "auto",
        });
        return {
          url: result.secure_url,
          publicId: result.public_id,
        };
      } else {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "auto" },
            (error, result) => {
              if (error || !result) {
                return reject(error || new Error("Cloudinary upload failed"));
              }
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          );
          uploadStream.end(fileOrDataUri);
        });
      }
    } catch (error: any) {
      console.error("❌ Cloudinary Upload Error:", error.message || error);
      if (typeof fileOrDataUri === "string") {
        return { url: fileOrDataUri };
      }
      throw error;
    }
  }

  /**
   * Delete an asset from Cloudinary by public ID.
   */
  public static async deleteImage(publicId: string): Promise<boolean> {
    if (!isCloudinaryConfigured || !publicId) return false;
    try {
      await cloudinary.uploader.destroy(publicId);
      return true;
    } catch (error) {
      console.error("❌ Cloudinary Delete Error:", error);
      return false;
    }
  }
}
