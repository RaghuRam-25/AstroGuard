import { Request, Response, NextFunction } from "express";
import { Astronaut } from "../models/Astronaut.js";
import { successResponse, errorResponse } from "../utils/response.js";

export class AstronautController {
  /**
   * GET /api/astronauts
   * List astronauts (scoped to role/assignments)
   */
  public static async getAstronauts(req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;
      let query: any = {};

      if (user) {
        if (user.role === "astronaut") {
          query.astronautId = user.astronautId;
        } else if (user.role === "medical_officer" && user.assignedAstronautIds && user.assignedAstronautIds.length > 0) {
          query.astronautId = { $in: user.assignedAstronautIds };
        } else if (user.role === "mission_control" && user.missionIds && user.missionIds.length > 0) {
          query.mission = { $in: user.missionIds };
        }
      }

      const astronauts = await Astronaut.find(query).sort({ createdAt: 1 });
      return successResponse(res, astronauts, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/astronauts/:id
   * Get specific astronaut by astronautId or ObjectId
   */
  public static async getAstronautById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const astronaut = await Astronaut.findOne({
        $or: [{ astronautId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });

      if (!astronaut) {
        return errorResponse(res, `Astronaut not found with ID: ${id}`, 404);
      }

      return successResponse(res, astronaut, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/astronauts
   * Create a new astronaut profile (Admin only)
   */
  public static async createAstronaut(req: Request, res: Response, next: NextFunction) {
    try {
      const existing = await Astronaut.findOne({ astronautId: req.body.astronautId });
      if (existing) {
        return errorResponse(res, `Astronaut with ID '${req.body.astronautId}' already exists`, 409);
      }

      const astronaut = await Astronaut.create(req.body);
      return successResponse(res, astronaut, 201, "Astronaut profile created successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/astronauts/:id
   * Update an astronaut profile (Admin & Medical Officer)
   */
  public static async updateAstronaut(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const astronaut = await Astronaut.findOneAndUpdate(
        { $or: [{ astronautId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }] },
        req.body,
        { new: true, runValidators: true }
      );

      if (!astronaut) {
        return errorResponse(res, `Astronaut not found with ID: ${id}`, 404);
      }

      return successResponse(res, astronaut, 200, "Astronaut profile updated successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/astronauts/:id
   * Remove an astronaut profile (Admin only)
   */
  public static async deleteAstronaut(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const astronaut = await Astronaut.findOneAndDelete({
        $or: [{ astronautId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
      });

      if (!astronaut) {
        return errorResponse(res, `Astronaut not found with ID: ${id}`, 404);
      }

      return successResponse(res, { deleted: true }, 200, "Astronaut profile deleted successfully");
    } catch (error) {
      next(error);
    }
  }
}
