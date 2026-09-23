import { Request, Response, NextFunction } from "express";
import { Astronaut } from "../models/Astronaut.js";
import { HealthData } from "../models/HealthData.js";
import { Analysis } from "../models/Analysis.js";
import { Alert } from "../models/Alert.js";
import { ClinicalReview } from "../models/ClinicalReview.js";
import { ConsultationReport } from "../models/ConsultationReport.js";
import { canDoctorManageAstronaut, assignedAstronautIdsForDoctor } from "../services/medicalAccess.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class MedicalController {
  private static async assignedAstronautIds(req: Request) {
    return assignedAstronautIdsForDoctor(req.user!);
  }

  private static async assertRosterAccess(req: Request, astronautId: string) {
    return Boolean(req.user && await canDoctorManageAstronaut(req.user, astronautId));
  }

  /** POST /api/medical/crew/:astronautId/reviews — persist the Doctor concept review. */
  public static async createClinicalReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      const { riskLevel, clinicalDiagnosis, countermeasure, forwardedToAuthority, forwardReason, recommendedAuthorityAction } = req.body;
      if (!(await MedicalController.assertRosterAccess(req, astronautId))) {
        return errorResponse(res, `Forbidden: Astronaut '${astronautId}' is not on your medical roster.`, 403);
      }
      if (!riskLevel || !clinicalDiagnosis || !countermeasure) {
        return errorResponse(res, "Risk level, clinical diagnosis, and countermeasure are required.", 400);
      }
      const review = await ClinicalReview.create({
        astronautId,
        reviewerId: req.user!._id.toString(),
        reviewerEmail: req.user!.email,
        riskLevel,
        clinicalDiagnosis,
        countermeasure,
        forwardedToAuthority: Boolean(forwardedToAuthority),
        forwardReason,
        recommendedAuthorityAction,
      });
      return successResponse(res, review, 201, "Clinical review submitted to the mission record.");
    } catch (error) { next(error); }
  }

  /** GET /api/medical/crew/:astronautId/reviews — latest Doctor concept reviews. */
  public static async getClinicalReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      if (!(await MedicalController.assertRosterAccess(req, astronautId))) {
        return errorResponse(res, `Forbidden: Astronaut '${astronautId}' is not on your medical roster.`, 403);
      }
      const reviews = await ClinicalReview.find({ astronautId }).sort({ createdAt: -1 }).limit(20);
      return successResponse(res, reviews, 200);
    } catch (error) { next(error); }
  }
  /** Shared enrichment for a set of strictly-assigned astronaut IDs. */
  private static async buildCrewSummary(astronautIds: string[]) {
    if (!astronautIds.length) return [];
    const astronauts = await Astronaut.find({ astronautId: { $in: astronautIds } }).sort({ name: 1 });
    return Promise.all(
      astronauts.map(async (ast) => {
        const [latestHealth, latestAnalysis, unresolvedAlerts] = await Promise.all([
          HealthData.findOne({ astronautId: ast.astronautId })
            .sort({ timestamp: -1 })
            .select("heartRate spo2 sleep activity timestamp"),
          Analysis.findOne({ astronautId: ast.astronautId })
            .sort({ createdAt: -1 })
            .select("anomalyScore riskLevel confidence createdAt"),
          Alert.countDocuments({ astronautId: ast.astronautId, resolved: false }),
        ]);

        return {
          astronautId: ast.astronautId,
          name: ast.name,
          role: ast.role,
          mission: ast.mission,
          missionDay: ast.missionDay,
          missionPhase: ast.missionPhase,
          status: ast.status,
          avatar: ast.avatar,
          latestHealth,
          latestAnalysis,
          unresolvedAlerts,
        };
      })
    );
  }

  /**
   * GET /api/medical/crew
   * Returns all astronauts assigned to this medical officer,
   * with their latest health telemetry and analysis summary.
   */
  public static async getCrew(req: Request, res: Response, next: NextFunction) {
    try {
      const assignedIds = await MedicalController.assignedAstronautIds(req);
      const crew = await MedicalController.buildCrewSummary(assignedIds);
      return successResponse(res, { crew, total: crew.length }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medical/my-astronauts (also /api/v1/medical/my-astronauts)
   * Strictly-scoped assignment list: only astronauts on this officer's
   * User.assignedAstronautIds roster OR a current MedicalAssignment.
   */
  public static async getMyAstronauts(req: Request, res: Response, next: NextFunction) {
    try {
      const assignedIds = await MedicalController.assignedAstronautIds(req);
      const astronauts = await MedicalController.buildCrewSummary(assignedIds);
      return successResponse(res, { astronauts, total: astronauts.length }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medical/crew/:astronautId
   * Full profile + latest vitals for a specific astronaut in this MO's roster.
   */
  public static async getCrewMember(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      // Enforce the current MedicalAssignment record
      if (!(await MedicalController.assertRosterAccess(req, astronautId))) {
        return errorResponse(
          res,
          `Forbidden: Astronaut '${astronautId}' is not on your medical roster.`,
          403
        );
      }

      const astronaut = await Astronaut.findOne({ astronautId });
      if (!astronaut) {
        return errorResponse(res, `Astronaut not found: ${astronautId}`, 404);
      }

      const [latestHealth, latestAnalysis, unresolvedAlerts] = await Promise.all([
        HealthData.findOne({ astronautId }).sort({ timestamp: -1 }),
        Analysis.findOne({ astronautId }).sort({ createdAt: -1 }),
        Alert.countDocuments({ astronautId, resolved: false }),
      ]);

      return successResponse(
        res,
        { astronaut, latestHealth, latestAnalysis, unresolvedAlerts },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medical/crew/:astronautId/health
   * Full health history for a specific crew member.
   */
  public static async getCrewMemberHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      if (!(await MedicalController.assertRosterAccess(req, astronautId))) {
        return errorResponse(
          res,
          `Forbidden: Astronaut '${astronautId}' is not on your medical roster.`,
          403
        );
      }

      const limit = parseInt((req.query.limit as string) || "50", 10);
      const page = parseInt((req.query.page as string) || "1", 10);
      const skip = (page - 1) * limit;

      const [records, total] = await Promise.all([
        HealthData.find({ astronautId })
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit),
        HealthData.countDocuments({ astronautId }),
      ]);

      return successResponse(res, { records, total, page, limit }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medical/crew/:astronautId/analysis
   * Analysis history for a specific crew member.
   */
  public static async getCrewMemberAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      if (!(await MedicalController.assertRosterAccess(req, astronautId))) {
        return errorResponse(
          res,
          `Forbidden: Astronaut '${astronautId}' is not on your medical roster.`,
          403
        );
      }

      const latest = await Analysis.findOne({ astronautId }).sort({ createdAt: -1 });
      const history = await Analysis.find({ astronautId })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("anomalyScore riskLevel confidence createdAt");

      return successResponse(res, { latest, history }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medical/crew/:astronautId/alerts
   * Alerts for a specific crew member.
   */
  public static async getCrewMemberAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId } = req.params;
      if (!(await MedicalController.assertRosterAccess(req, astronautId))) {
        return errorResponse(
          res,
          `Forbidden: Astronaut '${astronautId}' is not on your medical roster.`,
          403
        );
      }

      const alerts = await Alert.find({ astronautId }).sort({ createdAt: -1 });
      return successResponse(res, alerts, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/medical/alerts
   * All alerts across all assigned astronauts.
   */
  public static async getAllCrewAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const assignedIds = await MedicalController.assignedAstronautIds(req);
      const query: any = { astronautId: { $in: assignedIds } };
      const alerts = await Alert.find(query).sort({ createdAt: -1 });
      return successResponse(res, alerts, 200);
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/medical/reports/:doctorId — AI handovers routed to this doctor. */
  public static async getConsultationReports(req: Request, res: Response, next: NextFunction) {
    try {
      const doctorId = req.params.doctorId === "me" ? req.user!._id.toString() : req.params.doctorId;
      if (doctorId !== req.user!._id.toString()) return errorResponse(res, "You may only access your assigned consultation reports.", 403);
      const reports = await ConsultationReport.find({ assignedDoctorId: doctorId }).sort({ timestamp: -1 }).limit(100).lean();
      return successResponse(res, { reports, total: reports.length, unreviewed: reports.filter((report) => report.status === "Unreviewed").length }, 200);
    } catch (error) { next(error); }
  }

  /** PATCH /api/medical/reports/:reportId — doctor approval/override and notes. */
  public static async updateConsultationReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, doctorNotes, doctorDecision } = req.body || {};
      const report = await ConsultationReport.findOne({ _id: req.params.reportId, assignedDoctorId: req.user!._id.toString() });
      if (!report) return errorResponse(res, "Consultation report not found or not assigned to this doctor.", 404);
      if (status && !["Unreviewed", "Reviewed"].includes(status)) return errorResponse(res, "Invalid report status.", 400);
      if (doctorDecision && !["Approved", "Overridden"].includes(doctorDecision)) return errorResponse(res, "Invalid clinical decision.", 400);
      report.status = status || report.status;
      report.doctorNotes = typeof doctorNotes === "string" ? doctorNotes : report.doctorNotes;
      report.doctorDecision = doctorDecision || report.doctorDecision;
      if (report.status === "Reviewed") { report.reviewedAt = new Date(); report.reviewedBy = req.user!._id.toString(); }
      await report.save();
      return successResponse(res, { report }, 200, "Consultation report review updated.");
    } catch (error) { next(error); }
  }
}
