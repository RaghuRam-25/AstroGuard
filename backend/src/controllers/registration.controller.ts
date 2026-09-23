import { Request, Response, NextFunction } from "express";
import { RegistrationWindow } from "../models/RegistrationWindow.js";
import { User } from "../models/User.js";
import { Astronaut } from "../models/Astronaut.js";
import { successResponse, errorResponse } from "../utils/response.js";

const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 1440;

export interface RegistrationStatusPayload {
  isRegistrationOpen: boolean;
  registrationExpiresAt: number | null;
  expiresInMs?: number;
  durationMinutes?: number;
}

export class RegistrationController {
  private static async currentWindow() {
    const docs = await RegistrationWindow.find().sort({ createdAt: -1 }).limit(1).lean();
    return docs[0];
  }

  /** Read current state; auto-expires persisted windows whose timestamp has passed. */
  private static async resolve(): Promise<RegistrationStatusPayload> {
    const doc = await RegistrationController.currentWindow();
    if (!doc) {
      return { isRegistrationOpen: false, registrationExpiresAt: null };
    }
    const expiresAt = doc.registrationExpiresAt ? new Date(doc.registrationExpiresAt).getTime() : 0;
    const open = Boolean(doc.isRegistrationOpen) && expiresAt > Date.now();
    if (doc.isRegistrationOpen && !open) {
      // Expired server-side: reset the persisted window so public reads see a closed gate.
      await RegistrationWindow.updateOne({ _id: doc._id }, { $set: { isRegistrationOpen: false, registrationExpiresAt: null } }).exec();
    }
    return {
      isRegistrationOpen: open,
      registrationExpiresAt: open ? expiresAt : null,
      expiresInMs: open ? expiresAt - Date.now() : undefined,
      durationMinutes: open ? doc.durationMinutes : undefined,
    };
  }

  public static async isRegistrationOpen(): Promise<boolean> {
    const state = await RegistrationController.resolve();
    return state.isRegistrationOpen;
  }

  /**
   * GET /api/registration/status (public)
   * Read-only registration gate consumed by the public Navbar / register page.
   */
  public static async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      return successResponse(res, await RegistrationController.resolve(), 200);
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
      return successResponse(res, await RegistrationController.resolve(), 200);
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
      const doc = await RegistrationWindow.findOneAndUpdate(
        {},
        {
          isRegistrationOpen: true,
          registrationExpiresAt: expiresAt,
          durationMinutes,
          openedBy: req.user?.name || "Mission Control",
          openedById: req.user?._id?.toString(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
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
      await RegistrationWindow.findOneAndUpdate(
        {},
        { isRegistrationOpen: false, registrationExpiresAt: null },
        { upsert: true, setDefaultsOnInsert: true }
      );
      return successResponse(res, { isRegistrationOpen: false, registrationExpiresAt: null }, 200, "Public registration window closed.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/registration-toggle
   * Mission governance compatibility endpoint for opening or closing the timed public gate.
   * Body: { isRegistrationOpen: boolean, durationMinutes?: number }
   */
  public static async toggleRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const isRegistrationOpen = Boolean(req.body?.isRegistrationOpen);
      if (!isRegistrationOpen) {
        await RegistrationWindow.findOneAndUpdate(
          {},
          { isRegistrationOpen: false, registrationExpiresAt: null },
          { upsert: true, setDefaultsOnInsert: true }
        );
        return successResponse(res, { isRegistrationOpen: false, registrationExpiresAt: null }, 200, "Public registration window closed.");
      }

      const durationMinutes = Math.round(Number(req.body?.durationMinutes || 15));
      if (!Number.isFinite(durationMinutes) || durationMinutes < MIN_DURATION_MINUTES || durationMinutes > MAX_DURATION_MINUTES) {
        return errorResponse(res, "durationMinutes must be between 1 and 1440.", 400);
      }

      const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
      await RegistrationWindow.findOneAndUpdate(
        {},
        {
          isRegistrationOpen: true,
          registrationExpiresAt: expiresAt,
          durationMinutes,
          openedBy: req.user?.name || "Mission Control",
          openedById: req.user?._id?.toString(),
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

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
      const astronautDocs = await Astronaut.find().select("astronautId status mission online").lean();
      const astroStatus = new Map(astronautDocs.map((a: any) => [a.astronautId, a]));
      const crew = users.map((u: any) => {
        const profile = u.astronautId ? astroStatus.get(u.astronautId) : undefined;
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
              : u.assignedAstronautIds?.length
              ? `${u.assignedAstronautIds.length} astronaut(s)`
              : "No caseload",
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
