import { NutritionService } from "./nutrition.service.js";
import { DailyNutrientIntake } from "../models/DailyNutrientIntake.js";
import { HealthData } from "../models/HealthData.js";

export interface IDynamicTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  hydrationMl: number;
  sodiumMg: number;
  potassiumMg: number;
  vitaminCMg: number;
  omega3Mg: number;
}

export interface INutrientDeficits {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  hydrationMl: number;
  sodiumMg: number;
  potassiumMg: number;
  vitaminCMg: number;
  omega3Mg: number;
}

export class PrescriptionService {
  static async getPrescriptionAndDeficits(astronautId: string) {
    const today = new Date().toISOString().split("T")[0];

    // 1. Get 24H Prescription (or generate AI plan)
    const plan = await NutritionService.latestOrCreate(astronautId);

    // 2. Get today's recorded intake
    const intake = (await DailyNutrientIntake.findOne({ astronautId, date: today }).lean()) || {
      astronautId,
      date: today,
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
    };

    // 3. Get latest vitals / health data for dynamic adjustment
    const latestHealth = await HealthData.findOne({ astronautId }).sort({ timestamp: -1 }).lean();

    const muscleFatigue = Number(latestHealth?.muscleFatigueIndex ?? 30);
    const activity = Number(latestHealth?.activity ?? 60);
    const hydrationPct = Number(latestHealth?.hydrationLevel ?? 75);

    // Dynamic Target Calculation:
    // Base target from Plan
    const baseCalories = plan.macroNutrients.calories || 2400;
    const baseProtein = plan.macroNutrients.proteinG || 90;
    const baseCarbs = plan.macroNutrients.carbohydratesG || 280;
    const baseFats = plan.macroNutrients.healthyFatsG || 75;
    const baseHydrationMl = Math.round((plan.hydrationPlan?.liters || 2.8) * 1000);
    const baseSodiumMg = plan.microNutrients?.sodiumMg || 2000;
    const basePotassiumMg = plan.microNutrients?.potassiumMg || 3400;
    const baseVitaminCMg = 90;
    const baseOmega3Mg = plan.macroNutrients?.omega3Mg || 1000;

    // Dynamic multipliers based on telemetry
    let dynamicProteinBonus = 0;
    if (muscleFatigue > 65) dynamicProteinBonus += 15;
    if (activity > 75) dynamicProteinBonus += 10;

    let dynamicHydrationBonus = 0;
    if (hydrationPct < 65) dynamicHydrationBonus += 400;
    if (activity > 75) dynamicHydrationBonus += 300;

    const dynamicTargets: IDynamicTargets = {
      calories: Math.round(baseCalories + (activity > 75 ? 200 : 0)),
      proteinG: baseProtein + dynamicProteinBonus,
      carbsG: baseCarbs,
      fatsG: baseFats,
      hydrationMl: baseHydrationMl + dynamicHydrationBonus,
      sodiumMg: baseSodiumMg + (hydrationPct < 60 ? 300 : 0),
      potassiumMg: basePotassiumMg,
      vitaminCMg: baseVitaminCMg,
      omega3Mg: baseOmega3Mg,
    };

    // Deficit calculations (target - actual, floor at 0)
    const deficits: INutrientDeficits = {
      calories: Math.max(0, dynamicTargets.calories - (intake.caloriesKcal || 0)),
      proteinG: Math.max(0, dynamicTargets.proteinG - (intake.proteinG || 0)),
      carbsG: Math.max(0, dynamicTargets.carbsG - (intake.carbsG || 0)),
      fatsG: Math.max(0, dynamicTargets.fatsG - (intake.fatsG || 0)),
      hydrationMl: Math.max(0, dynamicTargets.hydrationMl - (intake.hydrationMl || 0)),
      sodiumMg: Math.max(0, dynamicTargets.sodiumMg - (intake.sodiumMg || 0)),
      potassiumMg: Math.max(0, dynamicTargets.potassiumMg - (intake.potassiumMg || 0)),
      vitaminCMg: Math.max(0, dynamicTargets.vitaminCMg - (intake.vitaminCMg || 0)),
      omega3Mg: Math.max(0, dynamicTargets.omega3Mg - (intake.omega3Mg || 0)),
    };

    // AI Smart Recommendations summary synthesis
    const recommendations: string[] = [];
    if (deficits.proteinG > 20 && muscleFatigue > 60) {
      recommendations.push(
        `⚠️ High Muscle Fatigue (${muscleFatigue}%) & Protein Deficit (-${deficits.proteinG}g): Scan Recovery Pack #3 or High-Protein Bar B post-exercise.`
      );
    } else if (deficits.proteinG > 25) {
      recommendations.push(
        `🥩 Protein Deficit Detected (-${deficits.proteinG}g remaining): Ingest Dehydrated Chicken Stew or High-Protein Bar B.`
      );
    }

    if (deficits.hydrationMl > 600 || hydrationPct < 65) {
      recommendations.push(
        `💧 Hydration Deficit (-${deficits.hydrationMl}mL): Bio-sensors indicate ${(hydrationPct).toFixed(0)}% hydration. Scan & drink Hydration Mix Pack #2 immediately.`
      );
    }

    if (deficits.sodiumMg > 500 && hydrationPct < 65) {
      recommendations.push(
        `⚡ Electrolyte Deficit: Sodium buffer low. Electrolyte enrichment recommended.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        `✅ All microgravity biometric nutrients within nominal tolerance bounds. Continue standard scheduled intake.`
      );
    }

    return {
      prescription: plan,
      intake,
      dynamicTargets,
      deficits,
      aiRecommendationSummary: recommendations.join(" | "),
      telemetrySnapshot: {
        muscleFatigueIndex: muscleFatigue,
        hydrationLevel: hydrationPct,
        activity,
        heartRate: latestHealth?.heartRate ?? 72,
        spo2: latestHealth?.spo2 ?? 98,
      },
    };
  }
}
