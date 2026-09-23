import { BioSample } from "../models/BioSample.js";
import { HealthData } from "../models/HealthData.js";
import { Prescriptions24H, IPrescriptions24H } from "../models/Prescriptions24H.js";
import { ConsultationReportService } from "./consultationReport.service.js";

export class NutritionService {
  static async buildPlan(astronautId: string, doctorId: string): Promise<IPrescriptions24H> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [sample, vitals] = await Promise.all([
      BioSample.findOne({ astronautId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).lean(),
      HealthData.findOne({ astronautId, timestamp: { $gte: since } }).sort({ timestamp: -1 }).lean(),
    ]);
    const activity = Number(vitals?.activity ?? 65);
    const hydration = Number(sample?.urine?.hydrationLevel ?? 75);
    const cortisol = Number(sample?.saliva?.cortisol ?? 12);
    const inflammation = Number(sample?.stool?.giInflammationMarkers ?? 0);
    const cbcStress = /low|abnormal|flagged/i.test(String(sample?.cbcScan?.status || ""));
    const liters = Number(Math.max(1.6, Math.min(3.2, 1.7 + activity * 0.006 + Math.max(0, 70 - hydration) * 0.012)).toFixed(1));
    const calories = Math.round(2100 + activity * 5 + (cortisol > 18 ? 120 : 0) + (cbcStress ? 150 : 0));
    const protein = Math.round(1.6 * 70 + activity * 0.15);
    const carbohydrates = Math.round(calories * 0.48 / 4);
    const fats = Math.round(calories * 0.28 / 9);
    const supplements = [
      { name: "Electrolyte balance protocol", dose: `${Math.round(liters * 450)} mg sodium equivalent across fluids`, timing: "Divide across waking hours", doctorApproved: false },
      ...(inflammation > 20 ? [{ name: "Probiotic support", dose: "Per approved onboard protocol", timing: "With first meal", doctorApproved: false }] : []),
      ...(cortisol > 18 ? [{ name: "Recovery nutrition emphasis", dose: "Protein-rich evening serving", timing: "Within 2 hours before sleep", doctorApproved: false }] : []),
    ];
    return Prescriptions24H.create({ astronautId, doctorId, validityTimestamp: new Date(Date.now() + 24 * 60 * 60 * 1000), macroNutrients: { calories, proteinG: protein, carbohydratesG: carbohydrates, healthyFatsG: fats, omega3Mg: 1000 }, microNutrients: { vitaminD3IU: 1000, vitaminEMg: 15, sodiumMg: Math.round(1800 + activity * 4), potassiumMg: Math.round(3200 + Math.max(0, 70 - hydration) * 5), electrolyteBalance: hydration < 60 ? "Elevated replacement target" : "Maintenance balance" }, hydrationPlan: { liters, beverage: "Electrolyte-enriched water", schedule: [`${(liters * 0.25).toFixed(1)} L on waking`, `${(liters * 0.5).toFixed(1)} L during activity window`, `${(liters * 0.25).toFixed(1)} L before sleep`] }, supplements, doctorApproved: false, source: "AI" });
  }

  static async latestOrCreate(astronautId: string): Promise<IPrescriptions24H> {
    const current = await Prescriptions24H.findOne({ astronautId, validityTimestamp: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (current) return current;
    const doctorId = await ConsultationReportService.resolveAssignedDoctorId(astronautId);
    return NutritionService.buildPlan(astronautId, doctorId);
  }

  static async doctorPlans(doctorId: string, astronautId?: string) {
    const query: Record<string, unknown> = { doctorId };
    if (astronautId) query.astronautId = astronautId;
    return Prescriptions24H.find(query).sort({ createdAt: -1 }).limit(100).lean();
  }
}
