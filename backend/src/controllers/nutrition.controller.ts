import { Request, Response, NextFunction } from "express";
import { Prescriptions24H } from "../models/Prescriptions24H.js";
import { DailyNutrientIntake } from "../models/DailyNutrientIntake.js";
import { NutritionService } from "../services/nutrition.service.js";
import { PrescriptionService } from "../services/prescription.service.js";
import { isAssignedMedicalOfficer } from "../services/medicalAccess.service.js";
import { successResponse, errorResponse } from "../utils/response.js";

// ─── RFID Meal Pack Catalogue ────────────────────────────
export const MEAL_PACK_CATALOGUE: Record<
  string,
  {
    name: string;
    packId: string;
    nutrients: {
      caloriesKcal: number;
      proteinG: number;
      carbsG: number;
      fatsG: number;
      hydrationMl: number;
      sodiumMg: number;
      potassiumMg: number;
      vitaminCMg: number;
      omega3Mg: number;
    };
  }
> = {
  "RFID-HMP-002": {
    name: "Hydration Mix Pack #2",
    packId: "RFID-HMP-002",
    nutrients: {
      caloriesKcal: 80,
      proteinG: 2,
      carbsG: 18,
      fatsG: 0,
      hydrationMl: 500,
      sodiumMg: 310,
      potassiumMg: 150,
      vitaminCMg: 60,
      omega3Mg: 0,
    },
  },
  "RFID-HPB-B": {
    name: "High-Protein Bar B",
    packId: "RFID-HPB-B",
    nutrients: {
      caloriesKcal: 290,
      proteinG: 25,
      carbsG: 24,
      fatsG: 8,
      hydrationMl: 50,
      sodiumMg: 220,
      potassiumMg: 180,
      vitaminCMg: 10,
      omega3Mg: 800,
    },
  },
  "RFID-DCS-001": {
    name: "Dehydrated Chicken Stew",
    packId: "RFID-DCS-001",
    nutrients: {
      caloriesKcal: 380,
      proteinG: 34,
      carbsG: 28,
      fatsG: 12,
      hydrationMl: 300,
      sodiumMg: 560,
      potassiumMg: 420,
      vitaminCMg: 4,
      omega3Mg: 200,
    },
  },
  "RFID-VBG-001": {
    name: "Veggie Grain Bowl",
    packId: "RFID-VBG-001",
    nutrients: {
      caloriesKcal: 260,
      proteinG: 12,
      carbsG: 42,
      fatsG: 5,
      hydrationMl: 200,
      sodiumMg: 380,
      potassiumMg: 510,
      vitaminCMg: 28,
      omega3Mg: 100,
    },
  },
  "RFID-RP3-003": {
    name: "Recovery Pack #3",
    packId: "RFID-RP3-003",
    nutrients: {
      caloriesKcal: 340,
      proteinG: 30,
      carbsG: 22,
      fatsG: 10,
      hydrationMl: 250,
      sodiumMg: 290,
      potassiumMg: 340,
      vitaminCMg: 40,
      omega3Mg: 1200,
    },
  },
};

const getTodayDateStr = () => new Date().toISOString().split("T")[0];

export class NutritionController {
  static async getMine(req: Request, res: Response, next: NextFunction) {
    try {
      const astronautId = req.user?.astronautId;
      if (!astronautId) return errorResponse(res, "Astronaut profile is required.", 400);
      const plan = await NutritionService.latestOrCreate(astronautId);
      return successResponse(
        res,
        {
          plan: plan.doctorApproved ? plan : null,
          pendingDoctorApproval: !plan.doctorApproved,
          nextRefreshAt: plan.validityTimestamp,
        },
        200
      );
    } catch (error) {
      next(error);
    }
  }

  /** GET /nutrition/intake — today's scanned intake totals from DB */
  static async getIntake(req: Request, res: Response, next: NextFunction) {
    try {
      const astronautId = req.user?.astronautId;
      if (!astronautId) return errorResponse(res, "Astronaut profile is required.", 400);
      const date = getTodayDateStr();

      let intake = await DailyNutrientIntake.findOne({ astronautId, date }).lean();
      if (!intake) {
        intake = {
          _id: "" as any,
          astronautId,
          date,
          caloriesKcal: 0,
          proteinG: 0,
          carbsG: 0,
          fatsG: 0,
          hydrationMl: 0,
          sodiumMg: 0,
          potassiumMg: 0,
          vitaminCMg: 0,
          omega3Mg: 0,
          scannedPacks: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      }
      return successResponse(res, { intake }, 200);
    } catch (error) {
      next(error);
    }
  }

  /** POST /nutrition/scan-meal — register RFID/barcode meal pack to DB */
  static async scanMeal(req: Request, res: Response, next: NextFunction) {
    try {
      const astronautId = req.user?.astronautId;
      if (!astronautId) return errorResponse(res, "Astronaut profile is required.", 400);
      const { packId } = req.body as { packId?: string };
      if (!packId) return errorResponse(res, "packId is required.", 400);

      const pack = MEAL_PACK_CATALOGUE[packId];
      if (!pack) return errorResponse(res, `Pack "${packId}" not found in catalogue.`, 404);

      const date = getTodayDateStr();
      const updatedIntake = await DailyNutrientIntake.findOneAndUpdate(
        { astronautId, date },
        {
          $inc: {
            caloriesKcal: pack.nutrients.caloriesKcal,
            proteinG: pack.nutrients.proteinG,
            carbsG: pack.nutrients.carbsG,
            fatsG: pack.nutrients.fatsG,
            hydrationMl: pack.nutrients.hydrationMl,
            sodiumMg: pack.nutrients.sodiumMg,
            potassiumMg: pack.nutrients.potassiumMg,
            vitaminCMg: pack.nutrients.vitaminCMg,
            omega3Mg: pack.nutrients.omega3Mg,
          },
          $push: {
            scannedPacks: {
              packId: pack.packId,
              name: pack.name,
              scannedAt: new Date(),
            },
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return successResponse(
        res,
        {
          scannedPack: pack,
          intake: updatedIntake,
          message: `${pack.name} registered successfully.`,
        },
        200,
        `RFID scan confirmed: ${pack.name}`
      );
    } catch (error) {
      next(error);
    }
  }

  /** GET /nutrition/prescription/:astronautId or GET /nutrition/prescription — AI-Driven Deficit & Dynamic Targets */
  static async getPrescription(req: Request, res: Response, next: NextFunction) {
    try {
      const astronautId = req.params.astronautId || req.user?.astronautId;
      if (!astronautId) return errorResponse(res, "Astronaut ID is required.", 400);

      const data = await PrescriptionService.getPrescriptionAndDeficits(astronautId);
      return successResponse(res, data, 200);
    } catch (error) {
      next(error);
    }
  }

  static async getDoctorPlans(req: Request, res: Response, next: NextFunction) {
    try {
      const astronautId = req.params.astronautId;
      if (!(await isAssignedMedicalOfficer(req.user!, astronautId))) {
        return errorResponse(res, "Forbidden: astronaut is not dynamically assigned to this Medical Officer.", 403);
      }
      const plans = await NutritionService.doctorPlans(req.user!._id.toString(), astronautId);
      return successResponse(res, { plans }, 200);
    } catch (error) {
      next(error);
    }
  }

  static async updateDoctorPlan(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await Prescriptions24H.findOne({
        _id: req.params.planId,
        doctorId: req.user!._id.toString(),
      });
      if (!plan || !(await isAssignedMedicalOfficer(req.user!, plan.astronautId))) {
        return errorResponse(res, "Prescription not found or not assigned to this Medical Officer.", 404);
      }
      const body = req.body || {};
      if (body.macroNutrients) plan.macroNutrients = { ...plan.macroNutrients, ...body.macroNutrients };
      if (body.microNutrients) plan.microNutrients = { ...plan.microNutrients, ...body.microNutrients };
      if (body.hydrationPlan) plan.hydrationPlan = { ...plan.hydrationPlan, ...body.hydrationPlan };
      if (Array.isArray(body.supplements)) plan.supplements = body.supplements;
      if (typeof body.doctorNotes === "string") plan.doctorNotes = body.doctorNotes;
      if (typeof body.doctorApproved === "boolean") plan.doctorApproved = body.doctorApproved;
      plan.source = "Doctor";
      plan.updatedBy = req.user!._id.toString();
      await plan.save();
      return successResponse(
        res,
        { plan },
        200,
        plan.doctorApproved ? "24-hour prescription approved and synced to astronaut." : "24-hour prescription updated."
      );
    } catch (error) {
      next(error);
    }
  }
}
