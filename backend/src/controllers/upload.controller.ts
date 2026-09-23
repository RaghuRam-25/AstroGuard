import { Request, Response } from "express";
import { UploadService } from "../services/upload.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class UploadController {
  /**
   * POST /api/upload
   * Accepts multipart file upload (req.file) or JSON { image: "data:image/...", folder?: string }
   */
  public static async uploadFile(req: Request, res: Response) {
    try {
      const folder = (req.body?.folder as string) || "astroguard/uploads";

      // Case 1: Upload via multipart file (multer memoryStorage)
      if (req.file) {
        const result = await UploadService.uploadImage(req.file.buffer, folder);
        return successResponse(
          res,
          {
            url: result.url,
            publicId: result.publicId,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          },
          200,
          "File uploaded successfully to Cloudinary"
        );
      }

      // Case 2: Upload via JSON base64 data URI or remote URL
      const image = req.body?.image;
      if (image && typeof image === "string") {
        const result = await UploadService.uploadImage(image, folder);
        return successResponse(
          res,
          {
            url: result.url,
            publicId: result.publicId,
          },
          200,
          "Image uploaded successfully to Cloudinary"
        );
      }

      return errorResponse(
        res,
        "No file or image data provided. Send a multipart file with key 'file' or JSON with 'image'.",
        400
      );
    } catch (error: any) {
      console.error("UploadController Error:", error);
      return errorResponse(res, error.message || "Failed to upload file", 500);
    }
  }
}
