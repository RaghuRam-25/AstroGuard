import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User, IUser } from "../models/User.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class UserController {
  /**
   * GET /api/users
   * List all users (Admin only)
   */
  public static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      return successResponse(res, users, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:id
   * Get single user by ID (Admin only)
   */
  public static async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return errorResponse(res, `User not found with ID: ${req.params.id}`, 404);
      }
      return successResponse(res, user, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/users
   * Create user with assigned role & parameters (Admin only)
   */
  public static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, role, astronautId, assignedAstronautIds, missionIds, isActive } = req.body;

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
        astronautId: role === "astronaut" ? astronautId : undefined,
        assignedAstronautIds: assignedAstronautIds || [],
        missionIds: missionIds || ["Ares Mission 01"],
        isActive: isActive !== undefined ? isActive : true,
      });

      return successResponse(res, user, 201, "User created successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/:id
   * Update user role, status, or assignments (Admin only)
   */
  public static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const updates: any = { ...req.body };

      if (updates.password) {
        const salt = await bcrypt.genSalt(12);
        updates.passwordHash = await bcrypt.hash(updates.password, salt);
        delete updates.password;
      }

      if (updates.email) {
        updates.email = updates.email.toLowerCase();
      }

      const user = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });

      if (!user) {
        return errorResponse(res, `User not found with ID: ${req.params.id}`, 404);
      }

      return successResponse(res, user, 200, "User updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/:id
   * Remove user (Admin only)
   */
  public static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return errorResponse(res, `User not found with ID: ${req.params.id}`, 404);
      }
      return successResponse(res, { deleted: true }, 200, "User removed successfully");
    } catch (error) {
      next(error);
    }
  }
}
