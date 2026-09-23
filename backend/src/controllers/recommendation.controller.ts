import { Request, Response, NextFunction } from "express";
import { MedicalRecommendation } from "../models/MedicalRecommendation.js";
import { canDoctorManageAstronaut } from "../services/medicalAccess.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class RecommendationController {
  /** POST /api/medical/recommendations — doctor pushes calm guidance to an assigned astronaut's dashboard. */
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const { astronautId, message, source, tone, approvedByDoctor } = req.body || {};
      if (!astronautId || !message || !String(message).trim()) {
        return errorResponse(res, "astronautId and a recommendation message are required.", 400);
      }
      if (!(await canDoctorManageAstronaut(user, astronautId))) {
        return errorResponse(res, `Forbidden: Astronaut '${astronautId}' is not assigned to you.`, 403);
      }
      const recommendation = await MedicalRecommendation.create({
        astronautId,
        doctorId: user._id.toString(),
        doctorName: user.name,
        message: String(message).trim().slice(0, 4000),
        source: source === "AI" ? "AI" : "Doctor",
        tone: tone === "urgent" ? "urgent" : tone === "preventive" ? "preventive" : "calm",
        approvedByDoctor: typeof approvedByDoctor === "string" && approvedByDoctor.trim() ? approvedByDoctor.trim().slice(0, 200) : undefined,
      });
      return successResponse(res, recommendation, 201, "Recommendation pushed to the astronaut dashboard.");
    } catch (error) { next(error); }
  }

  /**
   * GET /api/medical/crew/:astronautId/recommendations  (doctor, roster-scoped)
   * GET /api/astronauts/me/recommendations             (astronaut, self only)
   */
  public static async listByAstronaut(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      let astronautId = String(req.params.astronautId || "").trim();
      if (!astronautId && user.role === "astronaut" && user.astronautId) astronautId = user.astronautId;
      if (!astronautId) return errorResponse(res, "Astronaut identifier is required.", 400);

      if (user.role === "medical_officer") {
        if (!(await canDoctorManageAstronaut(user, astronautId))) {
          return errorResponse(res, `Forbidden: Astronaut '${astronautId}' is not assigned to you.`, 403);
        }
      } else if (user.role === "astronaut") {
        if (user.astronautId !== astronautId) return errorResponse(res, "You may only view your own recommendations.", 403);
      } else {
        return errorResponse(res, "Forbidden: this endpoint requires an assigned Medical Officer or the astronaut themself.", 403);
      }

      const limit = Math.min(Math.max(parseInt(String(req.query.limit || "20"), 10) || 20, 1), 100);
      const recommendations = await MedicalRecommendation.find({ astronautId }).sort({ createdAt: -1 }).limit(limit).lean();
      const unreadCount = recommendations.filter((recommendation) => !recommendation.readAt).length;
      return successResponse(res, { recommendations, unread: unreadCount, total: recommendations.length }, 200);
    } catch (error) { next(error); }
  }

  /** PATCH /api/astronauts/me/recommendations/:id/read — calm acknowledgement, no alarm UI. */
  public static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user!;
      const recommendation = await MedicalRecommendation.findOne({ _id: req.params.id });
      if (!recommendation) return errorResponse(res, "Recommendation not found.", 404);
      if (!user.astronautId || recommendation.astronautId !== user.astronautId) {
        return errorResponse(res, "You may only acknowledge your own recommendations.", 403);
      }
      recommendation.readAt = new Date();
      await recommendation.save();
      return successResponse(res, recommendation, 200, "Recommendation acknowledged.");
    } catch (error) { next(error); }
  }
}