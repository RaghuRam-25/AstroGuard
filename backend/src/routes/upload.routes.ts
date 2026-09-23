import { Router } from "express";
import multer from "multer";
import { UploadController } from "../controllers/upload.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

// Store files in memory so they can be piped straight to Cloudinary without writing to disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

// Allow authenticated users to upload files/avatars
router.post("/", authenticate, upload.single("file"), UploadController.uploadFile);

// Public avatar/image upload endpoint (useful during registration before user is logged in)
router.post("/public", upload.single("file"), UploadController.uploadFile);

export default router;
