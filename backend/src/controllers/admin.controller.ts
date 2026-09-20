import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Astronaut } from "../models/Astronaut.js";
import { Mission } from "../models/Mission.js";
import { AuditLog } from "../models/AuditLog.js";
import { Alert } from "../models/Alert.js";
import { successResponse, errorResponse } from "../utils/response.js";

// ─────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────

const getIp = (req: Request) =>
  (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  "unknown";

const logAudit = async (
  req: Request,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, any>
) => {
  try {
    await AuditLog.create({
      userId: req.user!._id.toString(),
      userEmail: req.user!.email,
      userRole: req.user!.role,
      action,
      resource,
      resourceId,
      metadata,
      ipAddress: getIp(req),
      userAgent: req.headers["user-agent"],
      success: true,
    });
  } catch {
    // Audit log failure should never block the primary request
  }
};

const formatUser = (user: any) => ({
  id: user._id?.toString() || user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  astronautId: user.astronautId,
  assignedAstronautIds: user.assignedAstronautIds,
  missionIds: user.missionIds,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// ─────────────────────────────────────────
//  Admin Controller
// ─────────────────────────────────────────

export class AdminController {
  // ─── USERS ───────────────────────────────

  /** GET /api/admin/users */
  public static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, isActive, search } = req.query;
      const query: any = {};

      if (role) query.role = role;
      if (isActive !== undefined) query.isActive = isActive === "true";
      if (search) {
        const re = new RegExp(String(search), "i");
        query.$or = [{ name: re }, { email: re }];
      }

      const users = await User.find(query).sort({ createdAt: -1 });
      return successResponse(res, { users: users.map(formatUser), total: users.length }, 200);
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/admin/users */
  public static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role, astronautId, assignedAstronautIds, missionIds } =
        req.body;

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return errorResponse(res, "An account with this email already exists.", 409);
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role,
        astronautId,
        assignedAstronautIds: assignedAstronautIds || [],
        missionIds: missionIds || [],
        isActive: true,
      });

      await logAudit(req, "USER_CREATED", "User", user._id.toString(), { role, email });

      return successResponse(res, { user: formatUser(user) }, 201, "User created successfully");
    } catch (error) {
      next(error);
    }
  }

  /** PUT /api/admin/users/:id */
  public static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, email, role, astronautId, assignedAstronautIds, missionIds, password } =
        req.body;

      const user = await User.findById(id);
      if (!user) return errorResponse(res, "User not found.", 404);

      if (name) user.name = name;
      if (email) user.email = email.toLowerCase();
      if (astronautId !== undefined) user.astronautId = astronautId;
      if (assignedAstronautIds) user.assignedAstronautIds = assignedAstronautIds;
      if (missionIds) user.missionIds = missionIds;

      const oldRole = user.role;
      if (role && role !== oldRole) {
        user.role = role;
        await logAudit(req, "ROLE_CHANGED", "User", id, { from: oldRole, to: role });
      }

      if (password) {
        const salt = await bcrypt.genSalt(12);
        user.passwordHash = await bcrypt.hash(password, salt);
      }

      await user.save();
      await logAudit(req, "USER_UPDATED", "User", id, { updatedFields: Object.keys(req.body) });

      return successResponse(res, { user: formatUser(user) }, 200, "User updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/admin/users/:id/status */
  public static async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findByIdAndUpdate(id, { isActive }, { new: true });
      if (!user) return errorResponse(res, "User not found.", 404);

      const action = isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED";
      await logAudit(req, action, "User", id, { isActive });

      return successResponse(res, { user: formatUser(user) }, 200);
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/admin/users/:id/role */
  public static async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const user = await User.findById(id);
      if (!user) return errorResponse(res, "User not found.", 404);

      const oldRole = user.role;
      user.role = role;
      await user.save();

      await logAudit(req, "ROLE_CHANGED", "User", id, { from: oldRole, to: role });

      return successResponse(res, { user: formatUser(user) }, 200, "Role updated successfully");
    } catch (error) {
      next(error);
    }
  }

  // ─── MISSIONS ────────────────────────────

  /** GET /api/admin/missions */
  public static async getMissions(req: Request, res: Response, next: NextFunction) {
    try {
      const missions = await Mission.find().sort({ createdAt: -1 });
      return successResponse(res, { missions, total: missions.length }, 200);
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/admin/missions */
  public static async createMission(req: Request, res: Response, next: NextFunction) {
    try {
      const { missionId, name, status, missionDay, startDate, endDate, description } = req.body;

      const existing = await Mission.findOne({ missionId });
      if (existing) return errorResponse(res, `Mission '${missionId}' already exists.`, 409);

      const mission = await Mission.create({
        missionId,
        name,
        status: status || "Active",
        missionDay: missionDay || 0,
        startDate,
        endDate,
        description,
      });

      await logAudit(req, "MISSION_CREATED", "Mission", mission._id.toString(), { name });

      return successResponse(res, mission, 201, "Mission created successfully");
    } catch (error) {
      next(error);
    }
  }

  /** PUT /api/admin/missions/:id */
  public static async updateMission(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const mission = await Mission.findOneAndUpdate(
        { $or: [{ _id: id }, { missionId: id }] },
        req.body,
        { new: true, runValidators: true }
      );

      if (!mission) return errorResponse(res, "Mission not found.", 404);
      await logAudit(req, "MISSION_UPDATED", "Mission", id, { updatedFields: Object.keys(req.body) });

      return successResponse(res, mission, 200, "Mission updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/admin/missions/:id/assign-astronaut */
  public static async assignAstronaut(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { astronautId } = req.body;

      const mission = await Mission.findOneAndUpdate(
        { $or: [{ _id: id }, { missionId: id }] },
        { $addToSet: { astronautIds: astronautId } },
        { new: true }
      );
      if (!mission) return errorResponse(res, "Mission not found.", 404);

      await logAudit(req, "ASTRONAUT_ASSIGNED", "Mission", id, { astronautId });
      return successResponse(res, mission, 200, "Astronaut assigned to mission");
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/admin/missions/:id/assign-medical-officer */
  public static async assignMedicalOfficer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const mission = await Mission.findOneAndUpdate(
        { $or: [{ _id: id }, { missionId: id }] },
        { $addToSet: { medicalOfficerIds: userId } },
        { new: true }
      );
      if (!mission) return errorResponse(res, "Mission not found.", 404);

      await logAudit(req, "MEDICAL_OFFICER_ASSIGNED", "Mission", id, { userId });
      return successResponse(res, mission, 200, "Medical officer assigned");
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/admin/missions/:id/assign-mission-control */
  public static async assignMissionControl(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { userId } = req.body;

      const mission = await Mission.findOneAndUpdate(
        { $or: [{ _id: id }, { missionId: id }] },
        { $addToSet: { missionControlUserIds: userId } },
        { new: true }
      );
      if (!mission) return errorResponse(res, "Mission not found.", 404);

      await logAudit(req, "MISSION_CONTROL_ASSIGNED", "Mission", id, { userId });
      return successResponse(res, mission, 200, "Mission control user assigned");
    } catch (error) {
      next(error);
    }
  }

  // ─── AUDIT LOGS ──────────────────────────

  /** GET /api/admin/audit-logs */
  public static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt((req.query.limit as string) || "50", 10);
      const page = parseInt((req.query.page as string) || "1", 10);
      const skip = (page - 1) * limit;
      const { action, userId } = req.query;

      const query: any = {};
      if (action) query.action = action;
      if (userId) query.userId = userId;

      const [logs, total] = await Promise.all([
        AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        AuditLog.countDocuments(query),
      ]);

      return successResponse(res, { logs, total, page, limit }, 200);
    } catch (error) {
      next(error);
    }
  }

  // ─── SYSTEM STATUS ────────────────────────

  /** GET /api/admin/system-status */
  public static async getSystemStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalUsers,
        astronautCount,
        medicalCount,
        missionControlCount,
        adminCount,
        totalAstronautProfiles,
        totalMissions,
        activeMissions,
        totalAlerts,
        unresolvedAlerts,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: "astronaut" }),
        User.countDocuments({ role: "medical_officer" }),
        User.countDocuments({ role: "mission_control" }),
        User.countDocuments({ role: "admin" }),
        Astronaut.countDocuments(),
        Mission.countDocuments(),
        Mission.countDocuments({ status: "Active" }),
        Alert.countDocuments(),
        Alert.countDocuments({ resolved: false }),
      ]);

      return successResponse(
        res,
        {
          users: {
            total: totalUsers,
            byRole: {
              astronaut: astronautCount,
              medical_officer: medicalCount,
              mission_control: missionControlCount,
              admin: adminCount,
            },
          },
          astronautProfiles: totalAstronautProfiles,
          missions: { total: totalMissions, active: activeMissions },
          alerts: { total: totalAlerts, unresolved: unresolvedAlerts },
          system: {
            status: "ONLINE",
            uptime: process.uptime(),
            nodeVersion: process.version,
            timestamp: new Date().toISOString(),
          },
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }
}
