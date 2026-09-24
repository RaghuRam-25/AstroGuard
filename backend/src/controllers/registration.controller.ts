import { Request, Response, NextFunction } from "express";
import { SystemSetting } from "../models/SystemSetting.js";
import { User } from "../models/User.js";
import { Astronaut } from "../models/Astronaut.js";
import { successResponse, errorResponse } from "../utils/response.js";

const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 1440;
const GLOBAL_SETTING_ID = "global";

export interface RegistrationStatusPayload {
  isRegistrationOpen: boolean;
  registrationExpiresAt: number | null;
  expiresInMs?: number;
  durationMinutes?: number;
}

export class RegistrationController {
  /** Read the singleton global SystemSetting row (never throws on a miss). */
  private static async getConfig(): Promise<Record<string, any> | null> {
    return SystemSetting.findById(GLOBAL_SETTING_ID).lean();
  }

  /** Upsert the singleton global row so toggles persist across requests/restarts. */
  private static async updateConfig(update: Record<string, unknown>) {
    return SystemSetting.findByIdAndUpdate(
      GLOBAL_SETTING_ID,
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).exec();
  }

  /** Read current state; auto-expires persisted windows whose timestamp has passed. */
  private static async resolve(): Promise<RegistrationStatusPayload> {
    const doc = await RegistrationController.getConfig();
    if (!doc) {
      return { isRegistrationOpen: false, registrationExpiresAt: null };
    }
    const expiresAt = doc.registrationExpiresAt ? new Date(doc.registrationExpiresAt).getTime() : 0;
    const open = Boolean(doc.isRegistrationOpen) && expiresAt > Date.now();
    if (doc.isRegistrationOpen && !open) {
      // Expired server-side: reset the persisted gate so public reads see a closed state.
      await RegistrationController.updateConfig({ isRegistrationOpen: false, registrationExpiresAt: null });
    }
    return {
      isRegistrationOpen: open,
      registrationExpiresAt: open ? expiresAt : null,
      expiresInMs: open ? expiresAt - Date.now() : undefined,
      durationMinutes: open ? doc.durationMinutes : undefined,
    };
  }

  /** Fail-closed read: DB hiccups must never turn a closed gate into an open sign-up. */
  private static async safeResolve(): Promise<RegistrationStatusPayload> {
    try {
      return await RegistrationController.resolve();
    } catch {
      return { isRegistrationOpen: false, registrationExpiresAt: null };
    }
  }

  public static async isRegistrationOpen(): Promise<boolean> {
    const state = await RegistrationController.safeResolve();
    return state.isRegistrationOpen;
  }

  /**
   * GET /api/registration/status (public)
   * Read-only registration gate consumed by the public Navbar / register page.
   */
  public static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      return successResponse(res, await RegistrationController.safeResolve(), 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/mission-control/registration
   * Mission Control's read of the live registration window state.
   */
  public static async getRegistrationState(req: Request, res: Response, next: NextFunction) {
    try {
      return successResponse(res, await RegistrationController.safeResolve(), 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/mission-control/registration/start
   * Opens a time-limited public registration window.
   * Body: { durationMinutes: number } (1..1440).
   */
  public static async startRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const durationMinutes = Math.round(Number(req.body?.durationMinutes));
      if (!Number.isFinite(durationMinutes) || durationMinutes < MIN_DURATION_MINUTES || durationMinutes > MAX_DURATION_MINUTES) {
        return errorResponse(res, "durationMinutes must be between 1 and 1440.", 400);
      }
      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
      await RegistrationController.updateConfig({
          isRegistrationOpen: true,
          registrationExpiresAt: expiresAt,
          durationMinutes,
          openedBy: req.user?.name || "Mission Control",
          openedById: req.user?._id?.toString(),
        });
      return successResponse(
        res,
        {
          isRegistrationOpen: true,
          registrationExpiresAt: expiresAt.getTime(),
          expiresInMs: durationMinutes * 60 * 1000,
          durationMinutes,
        },
        200,
        `Public registration opened for ${durationMinutes} minute window.`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/mission-control/registration/close
   * Forced immediate close of the registration window.
   */
  public static async closeRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      await RegistrationController.updateConfig({ isRegistrationOpen: false, registrationExpiresAt: null });
      return successResponse(res, { isRegistrationOpen: false, registrationExpiresAt: null }, 200, "Public registration window closed.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/mission-control/registration-toggle
   * POST /api/v1/admin/registration-toggle (legacy body key)
   * Persist the public registration gate on the global SystemSetting row.
   * Body: { isOpen: boolean, durationMinutes?: number } (legacy: { isRegistrationOpen, durationMinutes })
   * When isOpen === true, registrationExpiresAt = now() + durationMinutes (default 15).
   */
  public static async toggleRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const requestedOpen =
        req.body?.isOpen !== undefined
          ? Boolean(req.body.isOpen)
          : Boolean(req.body?.isRegistrationOpen);

      if (!requestedOpen) {
        await RegistrationController.updateConfig({ isRegistrationOpen: false, registrationExpiresAt: null, durationMinutes: null });
        return successResponse(res, { isRegistrationOpen: false, registrationExpiresAt: null }, 200, "Public registration window closed.");
      }

      const durationMinutes = Math.round(Number(req.body?.durationMinutes || 15));
      if (!Number.isFinite(durationMinutes) || durationMinutes < MIN_DURATION_MINUTES || durationMinutes > MAX_DURATION_MINUTES) {
        return errorResponse(res, "durationMinutes must be between 1 and 1440.", 400);
      }

      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
      await RegistrationController.updateConfig({
          isRegistrationOpen: true,
          registrationExpiresAt: expiresAt,
          durationMinutes,
          openedBy: req.user?.name || "Mission Control",
          openedById: req.user?._id?.toString(),
        });

      return successResponse(
        res,
        {
          isRegistrationOpen: true,
          registrationExpiresAt: expiresAt.getTime(),
          expiresInMs: durationMinutes * 60 * 1000,
          durationMinutes,
        },
        200,
        `Public registration opened for ${durationMinutes} minute window.`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/mission-control/crew
   * Unified crew directory: all astronauts + medical officers with account status.
   */
  public static async getCrew(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await User.find({ role: { $in: ["astronaut", "medical_officer"] } })
        .select("name email role astronautId assignedAstronautIds missionIds isActive createdAt")
        .sort({ name: 1 })
        .lean();
      const astronautDocs = await Astronaut.find().select("astronautId status mission online assignedDoctorId").lean();
      const astroStatus = new Map(astronautDocs.map((a: any) => [a.astronautId, a]));
      const doctorNames = new Map(
        users.filter((u: any) => u.role === "medical_officer").map((d: any) => [String(d._id), d.name])
      );
      const astrosByDoctor = new Map<string, string[]>();
      astronautDocs.forEach((a: any) => {
        if (a.assignedDoctorId) {
          const key = String(a.assignedDoctorId);
          astrosByDoctor.set(key, [...(astrosByDoctor.get(key) || []), a.astronautId]);
        }
      });
      const crew = users.map((u: any) => {
        const profile = u.astronautId ? astroStatus.get(u.astronautId) : undefined;
        const doctorCaseload = astrosByDoctor.get(String(u._id)) || [];
        const caseload = [...new Set([...(u.assignedAstronautIds || []), ...doctorCaseload])];
        const assignedDoctorId =
          u.role === "astronaut" && profile?.assignedDoctorId ? String(profile.assignedDoctorId) : null;
        return {
          userId: u._id.toString(),
          crewId: u.astronautId || `MC-${String(u._id).slice(-4).toUpperCase()}`,
          name: u.name,
          email: u.email,
          role: u.role,
          avatar: (profile as any)?.avatar || u.name.charAt(0).toUpperCase(),
          assigned:
            u.role === "astronaut"
              ? (profile as any)?.mission || u.missionIds?.[0] || "Unassigned"
              : caseload.length
              ? `${caseload.length} astronaut(s)`
              : "No caseload",
          assignedDoctorId,
          assignedDoctor:
            assignedDoctorId && doctorNames.has(assignedDoctorId)
              ? { userId: assignedDoctorId, name: doctorNames.get(assignedDoctorId) }
              : null,
          accountStatus: u.isActive === false ? "Banned" : "Active",
          online: Boolean((profile as any)?.online),
          status: (profile as any)?.status || (u.isActive === false ? "Revoked" : "Registered"),
          missionIds: u.missionIds || [],
          assignedAstronautIds: u.assignedAstronautIds || [],
          createdAt: u.createdAt,
        };
      });
      return successResponse(res, { crew, total: crew.length }, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/mission-control/user/:userId
   * Revoke access + hard-delete an astronaut or medical officer account.
   */
  public static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      if (!userId || /^[0-9a-fA-F]{24}$/.test(userId) === false) {
        return errorResponse(res, "Invalid user identifier.", 400);
      }
      const user: any = await User.findById(userId);
      if (!user) {
        return errorResponse(res, "User not found.", 404);
      }
      const name = user.name;
      const role = user.role;
      if (user.astronautId) {
        await Astronaut.deleteOne({ astronautId: user.astronautId }).exec();
        await User.updateMany({ assignedAstronautIds: user.astronautId }, { $pull: { assignedAstronautIds: user.astronautId } }).exec();
      }
      await User.deleteOne({ _id: userId }).exec();
      return successResponse(res, { userId, name, role: "REVOKED" }, 200, `Access revoked for ${name}.`);
    } catch (error) {
      next(error);
    }
  }
}
