import { Request, Response, NextFunction } from "express";
import { Mission } from "../models/Mission.js";
import { Astronaut } from "../models/Astronaut.js";
import { HealthData } from "../models/HealthData.js";
import { Analysis } from "../models/Analysis.js";
import { Alert } from "../models/Alert.js";
import { User } from "../models/User.js";
import { MedicalAssignment } from "../models/MedicalAssignment.js";
import { ClinicalReview } from "../models/ClinicalReview.js";
import { AuthorityDirective } from "../models/AuthorityDirective.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class MissionControlController {
  private static async assignedAstronaut(user: any, astronautId: string) {
    const missions = user.missionIds || [];
    return Astronaut.findOne({ astronautId, ...(missions.length ? { mission: { $in: missions } } : {}) }).lean();
  }

  /**
   * The ONLY legitimate astronauts are registered, active User accounts whose
   * role is exactly "astronaut" (the schema enum value). Astronaut profile
   * documents alone — seeded/demo crew, leftovers from deleted accounts, or
   * telemetry-generated records — are NOT crew and must never count or list.
   * Mission scoping uses each astronaut User's missionIds so each dashboard
   * only sees astronauts assigned to the missions the Mission Control user
   * itself is assigned to.
   */
  private static async scopedRegisteredAstronauts(missionNames: string[]) {
    const astronautUsers = await User.find({
      role: "astronaut",
      isActive: true,
      astronautId: { $exists: true, $ne: "" },
      ...(missionNames.length ? { missionIds: { $in: missionNames } } : {}),
    })
      .select("name email astronautId missionIds")
      .sort({ name: 1 })
      .lean();

    const astronautIds = [
      ...new Set(astronautUsers.map((item) => item.astronautId).filter((id): id is string => Boolean(id))),
    ];
    const profiles = astronautIds.length
      ? await Astronaut.find({
          astronautId: { $in: astronautIds },
          ...(missionNames.length ? { mission: { $in: missionNames } } : {}),
        }).lean()
      : [];
    const profileById = new Map(profiles.map((profile) => [profile.astronautId, profile]));
    return { astronautUsers, astronautIds, profileById };
  }

  public static async getDirectives(req: Request, res: Response, next: NextFunction) {
    try {
      const missionIds = req.user!.missionIds || [];
      const { astronautIds } = await MissionControlController.scopedRegisteredAstronauts(missionIds);
      const directives = await AuthorityDirective.find({ astronautId: { $in: astronautIds } }).sort({ createdAt: -1 }).limit(100).lean();
      return successResponse(res, { directives }, 200);
    } catch (error) { next(error); }
  }

  public static async issueDirective(req: Request, res: Response, next: NextFunction) {
    try {
      const { astronautId, directiveType, orders } = req.body || {};
      if (!astronautId || !directiveType || !orders) return errorResponse(res, "Astronaut, directive type, and orders are required.", 400);
      if (!["EARTH_RETURN_EMERGENCY", "EVA_ABORT", "MEDICAL_QUARANTINE", "PROTOCOL_APPROVED"].includes(directiveType)) return errorResponse(res, "Unsupported directive type.", 400);
      if (!(await MissionControlController.assignedAstronaut(req.user!, astronautId))) return errorResponse(res, "Astronaut is outside your assigned mission authority.", 403);
      const directive = await AuthorityDirective.create({ astronautId, directiveType, orders: String(orders).slice(0, 4000), issuedBy: req.user!._id.toString(), issuedByEmail: req.user!.email, issuedByRole: req.user!.role, status: "ACTIVE_ORDER" });
      return successResponse(res, directive, 201, "Life-priority authority directive issued.");
    } catch (error) { next(error); }
  }

  public static async updateDirective(req: Request, res: Response, next: NextFunction) {
    try {
      const directive = await AuthorityDirective.findById(req.params.id);
      if (!directive) return errorResponse(res, "Directive not found.", 404);
      if (!(await MissionControlController.assignedAstronaut(req.user!, directive.astronautId))) return errorResponse(res, "Directive is outside your assigned mission authority.", 403);
      const status = String(req.body?.status || "");
      if (!["ISSUED", "ACTIVE_ORDER", "EXECUTING", "RESOLVED"].includes(status)) return errorResponse(res, "Invalid directive lifecycle status.", 400);
      directive.status = status as any; directive.updatedBy = req.user!._id.toString(); await directive.save();
      return successResponse(res, directive, 200, "Directive lifecycle updated.");
    } catch (error) { next(error); }
  }
  private static async readiness(astronautId: string) {
    const [review, analysis] = await Promise.all([
      ClinicalReview.findOne({ astronautId }).sort({ createdAt: -1 }).select("riskLevel createdAt").lean(),
      Analysis.findOne({ astronautId }).sort({ createdAt: -1 }).select("riskLevel createdAt").lean(),
    ]);
    const risk = String(review?.riskLevel || analysis?.riskLevel || "LOW").toUpperCase();
    if (risk === "CRITICAL") return { readinessBadge: "RED", readinessLabel: "Critical / Unfit for Duty / Mission Abort Risk" };
    if (risk === "WARNING" || risk === "WATCH" || risk === "MODERATE") return { readinessBadge: "YELLOW", readinessLabel: "Moderate Risk / Medical Review" };
    return { readinessBadge: "GREEN", readinessLabel: "Fit for Mission Duty" };
  }

  public static async getMedicalAllocations(req: Request, res: Response, next: NextFunction) {
    try {
      const missionId = String(req.query.missionId || (req.user!.missionIds || ["Ares Mission 01"])[0]);
      const officers = await User.find({ role: "medical_officer", isActive: true }).select("name email assignedAstronautIds").sort({ name: 1 });
      const allocations = await MedicalAssignment.find({ missionId }).sort({ updatedAt: -1 });
      return successResponse(res, { missionId, officers, allocations }, 200);
    } catch (error) { next(error); }
  }

  public static async updateMedicalAllocation(req: Request, res: Response, next: NextFunction) {
    try {
      const missionId = String(req.body?.missionId || (req.user!.missionIds || ["Ares Mission 01"])[0]);
      const medicalOfficerId = String(req.params.medicalOfficerId);
      const astronautIds = Array.isArray(req.body?.astronautIds) ? [...new Set(req.body.astronautIds.map(String))] : [];
      const officer = await User.findOne({ _id: medicalOfficerId, role: "medical_officer" });
      if (!officer) return errorResponse(res, "Medical Officer not found.", 404);
      await User.updateMany({ role: "medical_officer", _id: { $ne: medicalOfficerId } }, { $pull: { assignedAstronautIds: { $in: astronautIds } } });
      const updated = await User.findByIdAndUpdate(medicalOfficerId, { $set: { assignedAstronautIds: astronautIds } }, { new: true }).select("name email assignedAstronautIds");
      const allocation = await MedicalAssignment.findOneAndUpdate({ missionId, medicalOfficerId }, { missionId, medicalOfficerId, astronautIds, updatedBy: req.user!._id.toString() }, { upsert: true, new: true, setDefaultsOnInsert: true });
      return successResponse(res, { officer: updated, allocation }, 200, "Medical staff allocation saved.");
    } catch (error) { next(error); }
  }
  /**
   * GET /api/mission-control/missions
   * List all missions assigned to this Mission Control user.
   */
  public static async getMissions(req: Request, res: Response, next: NextFunction) {
    try {
      const missions = await Mission.find({}).sort({ createdAt: -1 });
      return successResponse(res, { missions }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/missions
   * Creates a mission and assigns the creating Mission Control user to it.
   */
  public static async createMission(req: Request, res: Response, next: NextFunction) {
    try {
      const name = String(req.body?.name || req.body?.title || "").trim();
      if (!name) return errorResponse(res, "Mission name is required.", 400);

      const missionId = String(req.body?.missionId || `MIS-${Date.now()}`).trim();
      const existing = await Mission.findOne({ $or: [{ missionId }, { name }] }).lean();
      if (existing) return errorResponse(res, "A mission with this ID or name already exists.", 409);

      const status = ["Active", "Completed", "Planned", "Aborted"].includes(req.body?.status)
        ? req.body.status
        : "Planned";
      const mission = await Mission.create({
        missionId,
        name,
        status,
        missionDay: Number.isFinite(Number(req.body?.missionDay)) ? Number(req.body.missionDay) : 0,
        startDate: req.body?.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body?.endDate ? new Date(req.body.endDate) : undefined,
        description: typeof req.body?.description === "string" ? req.body.description.trim() : undefined,
        astronautIds: Array.isArray(req.body?.astronautIds) ? [...new Set(req.body.astronautIds.map(String))] : [],
        medicalOfficerIds: Array.isArray(req.body?.medicalOfficerIds) ? [...new Set(req.body.medicalOfficerIds.map(String))] : [],
        missionControlUserIds: [req.user!._id.toString()],
      });

      await User.updateOne({ _id: req.user!._id }, { $addToSet: { missionIds: { $each: [mission.name, mission.missionId] } } });
      if (mission.astronautIds.length) {
        await Astronaut.updateMany({ astronautId: { $in: mission.astronautIds } }, { $set: { mission: mission.name, missionDay: mission.missionDay, status: "Active" } });
      }

      return successResponse(res, { mission }, 201, "Mission created.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/mission-control/assign-mission
   * Assigns an astronaut to a mission controlled by the logged-in Mission Control user.
   * Body: { astronautId: string, missionId: string }
   */
  public static async assignMission(req: Request, res: Response, next: NextFunction) {
    try {
      const astronautId = String(req.body?.astronautId || "").trim();
      const missionId = String(req.body?.missionId || "").trim();
      if (!astronautId || !missionId) return errorResponse(res, "astronautId and missionId are required.", 400);

      const mission = await Mission.findOne({ $or: [{ missionId }, { name: missionId }] });
      if (!mission) return errorResponse(res, "Mission not found.", 404);

      const userMissionIds = req.user!.missionIds || [];
      const hasAccess =
        userMissionIds.includes(mission.name) ||
        userMissionIds.includes(mission.missionId) ||
        mission.missionControlUserIds.includes(req.user!._id.toString());
      if (!hasAccess) return errorResponse(res, "Mission is outside your assigned mission authority.", 403);

      const astronaut = await Astronaut.findOneAndUpdate(
        { astronautId },
        { $set: { mission: mission.name, missionDay: mission.missionDay, status: "Active" } },
        { new: true }
      );
      if (!astronaut) return errorResponse(res, "Astronaut not found.", 404);

      await Mission.updateMany({ _id: { $ne: mission._id } }, { $pull: { astronautIds: astronautId } });
      mission.astronautIds = [...new Set([...(mission.astronautIds || []), astronautId])];
      await mission.save();
      await User.updateOne({ astronautId }, { $addToSet: { missionIds: mission.name } });

      return successResponse(res, { astronaut, mission }, 200, `${astronaut.name} assigned to ${mission.name}.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mission-control/:missionId/overview
   * High-level mission status: crew count, health distribution, mission metadata.
   */
  public static async getMissionOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { missionId } = req.params;
      const user = req.user!;

      // Find mission (by missionId field OR name for backwards compat)
      const mission = await Mission.findOne({
        $or: [{ missionId }, { name: missionId }],
      });

      if (!mission) {
        return errorResponse(res, `Mission not found: ${missionId}`, 404);
      }

      // Enforce that this MC user is assigned to this mission
      const userMissionIds = user.missionIds || [];
      const hasAccess =
        userMissionIds.includes(mission.name) ||
        userMissionIds.includes(mission.missionId);
      if (!hasAccess) {
        return errorResponse(res, `Forbidden: You are not assigned to mission '${missionId}'.`, 403);
      }

      // Get all astronauts in this mission (registered accounts only)
      const { astronautIds } = await MissionControlController.scopedRegisteredAstronauts([mission.name, mission.missionId]);

      // Aggregate latest analysis for each astronaut
      const analyses = await Promise.all(
        astronautIds.map((id) =>
          Analysis.findOne({ astronautId: id })
            .sort({ createdAt: -1 })
            .select("astronautId anomalyScore riskLevel confidence createdAt")
        )
      );

      const validAnalyses = analyses.filter(Boolean);
      const distribution = {
        Normal: 0,
        Watch: 0,
        Warning: 0,
        Critical: 0,
      };
      validAnalyses.forEach((a) => {
        if (a) {
          const rawRisk = a.riskLevel as string;
          const displayLevel = (rawRisk === "Low" ? "Normal" : rawRisk) as keyof typeof distribution;
          if (displayLevel in distribution) {
            distribution[displayLevel]++;
          } else {
            distribution.Normal++;
          }
        }
      });

      const activeAlerts = await Alert.countDocuments({
        astronautId: { $in: astronautIds },
        resolved: false,
      });

      return successResponse(
        res,
        {
          mission,
          crewSize: astronautIds.length,
          distribution,
          activeAlerts,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mission-control/:missionId/crew
   * All crew members with latest health summaries (mission-level view, not full medical).
   */
  public static async getMissionCrew(req: Request, res: Response, next: NextFunction) {
    try {
      const { missionId } = req.params;
      const user = req.user!;

      const mission = await Mission.findOne({
        $or: [{ missionId }, { name: missionId }],
      });

      if (!mission) {
        return errorResponse(res, `Mission not found: ${missionId}`, 404);
      }

      const userMissionIds = user.missionIds || [];
      if (
        !userMissionIds.includes(mission.name) &&
        !userMissionIds.includes(mission.missionId)
      ) {
        return errorResponse(res, `Forbidden: Not assigned to mission '${missionId}'.`, 403);
      }

      const { astronautUsers, astronautIds, profileById } =
        await MissionControlController.scopedRegisteredAstronauts([mission.name, mission.missionId]);

      const crew = await Promise.all(
        astronautUsers.map(async (user) => {
          const astronautId = user.astronautId as string;
          const profile = profileById.get(astronautId);
          const [readiness, unresolvedAlerts] = await Promise.all([
            MissionControlController.readiness(astronautId),
            Alert.countDocuments({ astronautId, resolved: false }),
          ]);

          return {
            astronautId,
            name: user.name,
            role: profile?.role || "Astronaut",
            missionDay: profile?.missionDay ?? null,
            missionPhase: profile?.missionPhase ?? null,
            status: profile?.status || "Registered",
            avatar: profile?.avatar,
            ...readiness,
            unresolvedAlerts,
          };
        })
      );

      return successResponse(res, { crew, total: crew.length }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mission-control/:missionId/alerts
   * All active alerts for the mission.
   */
  public static async getMissionAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const { missionId } = req.params;
      const user = req.user!;

      const mission = await Mission.findOne({
        $or: [{ missionId }, { name: missionId }],
      });

      if (!mission) {
        return errorResponse(res, `Mission not found: ${missionId}`, 404);
      }

      const userMissionIds = user.missionIds || [];
      if (
        !userMissionIds.includes(mission.name) &&
        !userMissionIds.includes(mission.missionId)
      ) {
        return errorResponse(res, `Forbidden: Not assigned to mission '${missionId}'.`, 403);
      }

      const { astronautIds } = await MissionControlController.scopedRegisteredAstronauts([mission.name, mission.missionId]);

      const alerts = await Alert.find({ astronautId: { $in: astronautIds } }).sort({ createdAt: -1 }).select("astronautId severity resolved createdAt").lean();
      const masked = await Promise.all(alerts.map(async (alert) => ({ astronautId: alert.astronautId, severity: alert.severity, resolved: alert.resolved, createdAt: alert.createdAt, ...(await MissionControlController.readiness(alert.astronautId)) })));
      return successResponse(res, masked, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mission-control/:missionId/analytics
   * Anomaly score trends, risk distribution, mission analytics.
   */
  public static async getMissionAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { missionId } = req.params;
      const user = req.user!;

      const mission = await Mission.findOne({
        $or: [{ missionId }, { name: missionId }],
      });

      if (!mission) {
        return errorResponse(res, `Mission not found: ${missionId}`, 404);
      }

      const userMissionIds = user.missionIds || [];
      if (
        !userMissionIds.includes(mission.name) &&
        !userMissionIds.includes(mission.missionId)
      ) {
        return errorResponse(res, `Forbidden: Not assigned to mission '${missionId}'.`, 403);
      }

      const { astronautIds } = await MissionControlController.scopedRegisteredAstronauts([mission.name, mission.missionId]);

      const readinessByAstronaut = await Promise.all(astronautIds.map(async (id) => ({ astronautId: id, ...(await MissionControlController.readiness(id)) })));
      const riskDistribution = { GREEN: 0, YELLOW: 0, RED: 0 };
      readinessByAstronaut.forEach((item) => { riskDistribution[item.readinessBadge as keyof typeof riskDistribution]++; });

      // Alert summary
      const alertSummary = await Alert.aggregate([
        { $match: { astronautId: { $in: astronautIds } } },
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]);

      return successResponse(
        res,
        {
          mission,
          readinessByAstronaut,
          riskDistribution,
          alertSummary,
          crewCount: astronautIds.length,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mission-control/dashboard (also /api/v1/mission-control/dashboard)
   * Clean command summary: crew roster, medical officers, and a high-level alert feed
   * with assigned-doctor context. Scope is restricted to the Mission Control user's missions.
   */
  public static async getDashboardSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const missionScope = req.user!.missionIds || [];
      const { astronautUsers, astronautIds, profileById } =
        await MissionControlController.scopedRegisteredAstronauts(missionScope);

      const [officers, alerts, openAggregates] = await Promise.all([
        User.find({ role: "medical_officer", isActive: true })
          .select("name email isActive assignedAstronautIds")
          .sort({ name: 1 })
          .lean(),
        astronautIds.length
          ? Alert.find({ astronautId: { $in: astronautIds } }).sort({ createdAt: -1 }).limit(80).lean()
          : [],
        astronautIds.length
          ? Alert.aggregate([
              { $match: { astronautId: { $in: astronautIds }, resolved: false } },
              {
                $project: {
                  astronautId: 1,
                  sev: {
                    $switch: {
                      branches: [
                        { case: { $eq: ["$severity", "Critical"] }, then: 4 },
                        { case: { $eq: ["$severity", "Warning"] }, then: 3 },
                        { case: { $eq: ["$severity", "Watch"] }, then: 2 },
                        { case: { $eq: ["$severity", "Normal"] }, then: 1 },
                      ],
                      default: 0,
                    },
                  },
                },
              },
              { $group: { _id: "$astronautId", count: { $sum: 1 }, maxSev: { $max: "$sev" } } },
            ])
          : [],
      ]);

      const doctorByAstronaut = new Map<string, { id: string; name: string }>();
      officers.forEach((officer) => {
        (officer.assignedAstronautIds || []).forEach((id) => {
          if (!doctorByAstronaut.has(id)) {
            doctorByAstronaut.set(id, { id: String(officer._id), name: officer.name });
          }
        });
      });

      const openByAstronaut = new Map<string, { count: number; maxSev: number }>(
        openAggregates.map((row: any) => [String(row._id), { count: row.count, maxSev: row.maxSev }])
      );
      const sevLabel: Record<number, string> = { 4: "Critical", 3: "Warning", 2: "Watch", 1: "Normal" };

      const roster = astronautUsers.map((user) => {
        const astronautId = user.astronautId as string;
        const doctor = doctorByAstronaut.get(astronautId);
        const open = openByAstronaut.get(astronautId);
        const profile = profileById.get(astronautId);
        return {
          astronautId,
          name: user.name,
          email: user.email,
          role: profile?.role ? String(profile.role) : "Astronaut",
          mission: profile?.mission || null,
          status: profile?.status ? String(profile.status) : "Registered",
          avatar: profile?.avatar ? String(profile.avatar) : "AM",
          online: profile ? profile.status === "Active" || profile.status === "Nominal" : false,
          assignedDoctorId: doctor?.id || null,
          assignedDoctorName: doctor?.name || null,
          unresolvedAlerts: open?.count || 0,
          alertLevel: open?.count ? sevLabel[open.maxSev] || "Normal" : null,
        };
      });

      const doctors = officers.map((officer) => ({
        id: String(officer._id),
        name: officer.name,
        email: officer.email,
        isActive: officer.isActive,
        assignedCount: (officer.assignedAstronautIds || []).length,
      }));

      const alertFeed = alerts.map((alert) => {
        const ast = astronautUsers.find((user) => user.astronautId === alert.astronautId);
        const doctor = doctorByAstronaut.get(alert.astronautId);
        return {
          id: String(alert._id),
          astronautId: alert.astronautId,
          astronautName: ast?.name || alert.astronautId,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          signal: alert.signal || null,
          resolved: alert.resolved,
          createdAt: alert.createdAt,
          assignedDoctorName: doctor?.name || null,
        };
      });

      const openAlertCount = roster.reduce((sum, row) => sum + row.unresolvedAlerts, 0);
      const criticalAlertCount = roster
        .filter((row) => row.alertLevel === "Critical")
        .reduce((sum, row) => sum + row.unresolvedAlerts, 0);
      const unassignedAlertCount = roster
        .filter((row) => row.unresolvedAlerts > 0 && !row.assignedDoctorId)
        .reduce((sum, row) => sum + row.unresolvedAlerts, 0);

      return successResponse(
        res,
        {
          astronauts: roster,
          doctors,
          alerts: alertFeed,
          counts: {
            totalAstronauts: astronautIds.length,
            onlineAstronauts: roster.filter((row) => row.online).length,
            totalDoctors: doctors.length,
            openAlerts: openAlertCount,
            criticalAlerts: criticalAlertCount,
            unassignedAlerts: unassignedAlertCount,
            assignedMissions: new Set(roster.map((row) => row.mission).filter(Boolean)).size,
          },
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/mission-control/assign-doctor (also /api/v1/mission-control/assign-doctor)
   * Assigns a Medical Officer to a single astronaut. Replaces any previous assignment so
   * the designated doctor immediately sees the astronaut in their roster dashboard.
   * Body: { astronautId: string, doctorId: string }
   */
  public static async assignDoctor(req: Request, res: Response, next: NextFunction) {
    try {
      const astronautId = String(req.body?.astronautId || "").trim();
      const doctorId = String(req.body?.doctorId ?? "").trim();
      // Empty / "none" / "unassigned" doctorId means UNASSIGN.
      const unassigning = !doctorId || doctorId === "none" || doctorId === "unassigned";
      if (!astronautId) {
        return errorResponse(res, "astronautId is required.", 400);
      }
      if (!(await MissionControlController.assignedAstronaut(req.user!, astronautId))) {
        return errorResponse(res, "Astronaut is outside your assigned mission authority.", 403);
      }
      const astronaut = await Astronaut.findOne({ astronautId }).lean();
      if (!astronaut) return errorResponse(res, `Astronaut '${astronautId}' not found.`, 404);

      if (unassigning) {
        // Pull the astronaut out of every officer's roster and every legacy
        // MedicalAssignment, clear the canonical Astronaut.assignedDoctorId,
        // and drop now-empty allocations.
        await User.updateMany({ role: "medical_officer" }, { $pull: { assignedAstronautIds: astronautId } });
        await MedicalAssignment.updateMany({}, { $pull: { astronautIds: astronautId } });
        await MedicalAssignment.deleteMany({ astronautIds: { $size: 0 } });
        await Astronaut.updateMany({ astronautId }, { $set: { assignedDoctorId: null } });
        return successResponse(
          res,
          { astronaut: { astronautId, name: astronaut.name, mission: astronaut.mission, assignedDoctorId: null }, doctor: null, allocation: null },
          200,
          `Flight surgeon unassigned from ${astronaut.name}.`
        );
      }

      const doctor = await User.findOne({ _id: doctorId, role: "medical_officer" });
      if (!doctor) return errorResponse(res, "Medical Officer not found or not an active flight surgeon.", 404);

      await User.updateMany({ role: "medical_officer", _id: { $ne: doctorId } }, { $pull: { assignedAstronautIds: astronautId } });
      await User.updateOne({ _id: doctorId }, { $addToSet: { assignedAstronautIds: astronautId } });
      const updated = await User.findById(doctorId).select("name email assignedAstronautIds isActive").lean();

      // Persist the canonical relation on the Astronaut record so the Medical
      // Officer dashboard, telemedicine peer list, and Mission Control crew
      // matrix all resolve the pairing from one source of truth.
      await Astronaut.updateMany({ astronautId }, { $set: { assignedDoctorId: doctorId } });
      await Astronaut.updateMany(
        { astronautId: { $ne: astronautId }, assignedDoctorId: doctorId },
        { $set: { assignedDoctorId: null } }
      );

      await MedicalAssignment.updateMany({ medicalOfficerId: { $ne: doctorId } }, { $pull: { astronautIds: astronautId } });
      let allocation = null;
      if (astronaut.mission) {
        allocation = await MedicalAssignment.findOneAndUpdate(
          { medicalOfficerId: doctorId, missionId: astronaut.mission },
          { $addToSet: { astronautIds: astronautId }, $set: { updatedBy: String(req.user!._id) } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }

      return successResponse(
        res,
        {
          astronaut: { astronautId, name: astronaut.name, mission: astronaut.mission, assignedDoctorId: doctorId },
          doctor: updated,
          allocation,
        },
        200,
        `Doctor ${updated?.name || doctor.name} assigned to ${astronaut.name}. They now appear on this Medical Officer's roster.`
      );
    } catch (error) {
      next(error);
    }
  }
}
