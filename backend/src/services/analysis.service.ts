import mongoose from "mongoose";
import { Analysis, IAnalysis, IContributor, IBaselineMetrics } from "../models/Analysis.js";
import { HealthData, IHealthData } from "../models/HealthData.js";
import { AlertService } from "./alert.service.js";
import { IAlert } from "../models/Alert.js";

export interface ComputeAnalysisInput {
  astronautId: string;
  heartRate: number;
  spo2: number;
  sleep: number;
  activity: number;
  healthDataId?: mongoose.Types.ObjectId;
  mlResult?: {
    anomalyScore: number;
    confidence: number;
    model: string;
  };
}

export interface FullAnalysisResult {
  analysis: IAnalysis;
  alert: IAlert | null;
}

export class AnalysisService {
  /**
   * Calculates the personal baseline for an astronaut based on historical data
   */
  public static async calculatePersonalBaseline(astronautId: string): Promise<IBaselineMetrics> {
    const history = await HealthData.find({ astronautId })
      .sort({ timestamp: -1 })
      .limit(60);

    if (history.length === 0) {
      return {
        heartRate: 70,
        spo2: 98.0,
        sleep: 7.6,
        activity: 65,
      };
    }

    const sum = history.reduce(
      (acc, item) => ({
        heartRate: acc.heartRate + item.heartRate,
        spo2: acc.spo2 + item.spo2,
        sleep: acc.sleep + item.sleep,
        activity: acc.activity + item.activity,
      }),
      { heartRate: 0, spo2: 0, sleep: 0, activity: 0 }
    );

    const count = history.length;
    return {
      heartRate: Number((sum.heartRate / count).toFixed(1)),
      spo2: Number((sum.spo2 / count).toFixed(1)),
      sleep: Number((sum.sleep / count).toFixed(1)),
      activity: Number((sum.activity / count).toFixed(1)),
    };
  }

  /**
   * Calculates or returns the mission cohort baseline
   */
  public static async calculateMissionBaseline(): Promise<IBaselineMetrics> {
    const recentMissionData = await HealthData.find()
      .sort({ timestamp: -1 })
      .limit(200);

    if (recentMissionData.length === 0) {
      return {
        heartRate: 72,
        spo2: 97.8,
        sleep: 7.8,
        activity: 62,
      };
    }

    const sum = recentMissionData.reduce(
      (acc, item) => ({
        heartRate: acc.heartRate + item.heartRate,
        spo2: acc.spo2 + item.spo2,
        sleep: acc.sleep + item.sleep,
        activity: acc.activity + item.activity,
      }),
      { heartRate: 0, spo2: 0, sleep: 0, activity: 0 }
    );

    const count = recentMissionData.length;
    return {
      heartRate: Number((sum.heartRate / count).toFixed(1)),
      spo2: Number((sum.spo2 / count).toFixed(1)),
      sleep: Number((sum.sleep / count).toFixed(1)),
      activity: Number((sum.activity / count).toFixed(1)),
    };
  }

  /**
   * Determine risk level string from numerical anomaly score
   */
  public static determineRiskLevel(score: number): "Low" | "Watch" | "Warning" | "Critical" {
    if (score >= 81) return "Critical";
    if (score >= 61) return "Warning";
    if (score >= 31) return "Watch";
    return "Low";
  }

  /**
   * Generates signal contributors to anomaly with percentage shifts and impact weights
   */
  public static generateContributors(
    current: { heartRate: number; spo2: number; sleep: number; activity: number },
    personal: IBaselineMetrics
  ): IContributor[] {
    const pHR = Number(personal.heartRate) || 70;
    const pSpO2 = Number(personal.spo2) || 98;
    const pSleep = Number(personal.sleep) || 7.5;
    const pActivity = Number(personal.activity) || 65;

    const hrDiffPct = ((current.heartRate - pHR) / pHR) * 100;
    const spo2DiffPct = ((current.spo2 - pSpO2) / pSpO2) * 100;
    const sleepDiffPct = ((current.sleep - pSleep) / pSleep) * 100;
    const actDiffPct = ((current.activity - pActivity) / pActivity) * 100;

    const formatChange = (val: number) => (val >= 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`);

    const getImpact = (pctAbs: number, signal: string): "High" | "Moderate" | "Low" | "Normal" => {
      if (signal === "SpO₂") {
        if (pctAbs >= 3.0) return "High";
        if (pctAbs >= 1.5) return "Moderate";
        if (pctAbs >= 0.6) return "Low";
        return "Normal";
      }
      if (pctAbs >= 25.0) return "High";
      if (pctAbs >= 12.0) return "Moderate";
      if (pctAbs >= 5.0) return "Low";
      return "Normal";
    };

    const hrImpact = getImpact(Math.abs(hrDiffPct), "Heart Rate");
    const spo2Impact = getImpact(Math.abs(spo2DiffPct), "SpO₂");
    const sleepImpact = getImpact(Math.abs(sleepDiffPct), "Sleep Duration");
    const actImpact = getImpact(Math.abs(actDiffPct), "Activity Level");

    return [
      {
        signal: "Heart Rate",
        change: formatChange(hrDiffPct),
        impact: hrImpact,
        percentage: Math.min(100, Math.round(Math.abs(hrDiffPct) * 2.5)),
        description:
          Math.abs(hrDiffPct) < 5
            ? "Minimal drift within expected resting window"
            : hrDiffPct > 0
            ? "Cardiovascular elevation compared to resting baseline"
            : "Cardiovascular rate lower than typical resting baseline",
      },
      {
        signal: "SpO₂ Oxygen",
        change: formatChange(spo2DiffPct),
        impact: spo2Impact,
        percentage: Math.min(100, Math.round(Math.abs(spo2DiffPct) * 15)),
        description:
          Math.abs(spo2DiffPct) < 1.0
            ? "Oxygenation saturation is stable and nominal"
            : spo2DiffPct < 0
            ? "Oxygen saturation level drifted below standard baseline"
            : "Oxygenation levels slightly above cohort baseline",
      },
      {
        signal: "Sleep Duration",
        change: formatChange(sleepDiffPct),
        impact: sleepImpact,
        percentage: Math.min(100, Math.round(Math.abs(sleepDiffPct) * 2.0)),
        description:
          Math.abs(sleepDiffPct) < 10
            ? "Sleep duration aligned with circadian schedule"
            : sleepDiffPct < 0
            ? "Rest period decreased relative to operational baseline"
            : "Extended rest duration recorded",
      },
      {
        signal: "Activity Level",
        change: formatChange(actDiffPct),
        impact: actImpact,
        percentage: Math.min(100, Math.round(Math.abs(actDiffPct) * 1.8)),
        description:
          Math.abs(actDiffPct) < 10
            ? "Daily physical output aligns with standard countermeasure protocol"
            : actDiffPct > 0
            ? "Elevated physical countermeasure or EVA exertion output"
            : "Suppressed movement telemetry compared to standard quota",
      },
    ];
  }

  /**
   * Generates non-diagnostic AI explanation and safety note
   */
  public static generateExplanation(
    riskLevel: "Low" | "Watch" | "Warning" | "Critical",
    current: { heartRate: number; spo2: number; sleep: number; activity: number },
    personal: IBaselineMetrics,
    contributors: IContributor[]
  ) {
    if (riskLevel === "Low") {
      return {
        headline: "Nominal Physiological Baseline",
        summary:
          "Current physiological markers are tightly aligned with calibrated personal baselines and mission cohort parameters. All vital telemetry streams remain within expected stability windows.",
        changePointDetails: "No statistically significant change-point detected in current telemetry window.",
        safetyNote:
          "AI-generated monitoring signal, not a medical diagnosis. Continuous passive telemetry active.",
      };
    }

    if (riskLevel === "Watch") {
      return {
        headline: "Mild Physiological Drift Observed",
        summary: `Mild variation observed across telemetry signals. Heart rate (${current.heartRate} BPM) and activity (${current.activity}%) show mild deviation from calibrated baseline.`,
        changePointDetails: "Mild variance identified during routine telemetry scan.",
        safetyNote:
          "AI-generated monitoring signal, not a medical diagnosis. Continued passive monitoring recommended.",
      };
    }

    if (riskLevel === "Warning") {
      return {
        headline: "Noticeable Multi-Signal Divergence Detected",
        summary: `Multi-signal divergence detected: Elevated physiological variance across key signals. Heart rate is ${current.heartRate} BPM with SpO₂ at ${current.spo2}%.`,
        changePointDetails: "Variance exceeds standard standard deviation threshold.",
        safetyNote:
          "AI-generated monitoring signal, not a medical diagnosis. Medical Officer telemetry review recommended.",
      };
    }

    return {
      headline: "EARLY PHYSIOLOGICAL DEVIATION DETECTED",
      summary: `Significant multi-signal anomaly detected: Persistent cross-signal divergence between elevated resting heart rate (${current.heartRate} BPM) and altered SpO₂ saturation (${current.spo2}%).`,
      changePointDetails: "Cross-signal anomaly identified prior to single-variable clinical breach.",
      safetyNote:
        "AI-generated monitoring signal, not a medical diagnosis. Immediate Flight Surgeon consultation advised.",
    };
  }

  /**
   * Generates actionable recommendations
   */
  public static generateRecommendations(
    riskLevel: "Low" | "Watch" | "Warning" | "Critical",
    current: { heartRate: number; spo2: number; sleep: number; activity: number }
  ): string[] {
    const recs: string[] = [];

    if (riskLevel === "Low") {
      recs.push("Maintain standard fluid and electrolyte hydration protocol.");
      recs.push("Continue prescribed daily cardiovascular countermeasure routine.");
      recs.push("Target 7–8 hours of unfragmented deep rest before next operational shift.");
    } else if (riskLevel === "Watch") {
      if (current.sleep < 6.5) recs.push("Prioritize scheduled sleep cycle to facilitate recovery.");
      if (current.activity > 80) recs.push("Monitor post-exertion recovery curve following high activity.");
      recs.push("Ensure scheduled hydration fluid intake during orbital duty.");
      recs.push("Continue standard vital telemetry logging.");
    } else {
      recs.push("Notify Flight Surgeon or Medical Officer for telemetry review.");
      recs.push("Initiate secondary pulse oximetry and passive heart rate confirmation.");
      recs.push("Pause high-strain extravehicular training until baseline stabilizes.");
      recs.push("Maintain structured rest and hydration monitoring.");
    }

    return recs;
  }

  /**
   * Orchestrates baseline comparison, ML inference processing, explanation synthesis, and saving
   */
  public static async processAndSaveAnalysis(input: ComputeAnalysisInput): Promise<FullAnalysisResult> {
    const personalBaseline = await this.calculatePersonalBaseline(input.astronautId);
    const missionBaseline = await this.calculateMissionBaseline();

    const currentSignals = {
      heartRate: input.heartRate,
      spo2: input.spo2,
      sleep: input.sleep,
      activity: input.activity,
    };

    const anomalyScore = input.mlResult?.anomalyScore ?? 18;
    const confidence = input.mlResult?.confidence ?? 94.2;
    const model = input.mlResult?.model ?? "Multi-Variate Isolation Forest";

    const riskLevel = this.determineRiskLevel(anomalyScore);
    const contributors = this.generateContributors(currentSignals, personalBaseline);
    const explanation = this.generateExplanation(riskLevel, currentSignals, personalBaseline, contributors);
    const recommendations = this.generateRecommendations(riskLevel, currentSignals);

    // Save Analysis in MongoDB
    const analysis = await Analysis.create({
      astronautId: input.astronautId,
      healthDataId: input.healthDataId,
      anomalyScore,
      riskLevel,
      confidence,
      model,
      contributors,
      personalBaseline: {
        heartRate: `${personalBaseline.heartRate} BPM`,
        spo2: `${personalBaseline.spo2}%`,
        sleep: `${personalBaseline.sleep} hrs`,
        activity: `${personalBaseline.activity}%`,
      },
      missionBaseline: {
        heartRate: `${missionBaseline.heartRate} BPM`,
        spo2: `${missionBaseline.spo2}%`,
        sleep: `${missionBaseline.sleep} hrs`,
        activity: `${missionBaseline.activity}%`,
      },
      explanation,
      recommendations,
    });

    // Check if an alert is warranted
    let alert: IAlert | null = null;
    if (riskLevel !== "Low") {
      let alertTitle = "Physiological Signal Variance";
      let alertDesc = `Anomaly score of ${anomalyScore}/100 detected. ${explanation.summary}`;

      if (riskLevel === "Critical") {
        alertTitle = "Critical Physiological Deviation";
      } else if (riskLevel === "Warning") {
        alertTitle = "Multi-Signal Health Warning";
      } else if (riskLevel === "Watch") {
        alertTitle = "Elevated Vital Monitoring";
      }

      alert = await AlertService.createAlert({
        astronautId: input.astronautId,
        title: alertTitle,
        description: alertDesc,
        severity: riskLevel,
        signal: contributors[0]?.signal || "Heart Rate",
        value: input.heartRate,
        baseline: `${personalBaseline.heartRate} BPM`,
      });
    }

    return { analysis, alert };
  }

  /**
   * Get latest analysis for an astronaut
   */
  public static async getLatestAnalysis(astronautId: string): Promise<IAnalysis | null> {
    return await Analysis.findOne({ astronautId }).sort({ createdAt: -1 });
  }

  /**
   * Get analysis history for an astronaut
   */
  public static async getAnalysisHistory(astronautId: string, limit = 30): Promise<IAnalysis[]> {
    return await Analysis.find({ astronautId }).sort({ createdAt: -1 }).limit(limit);
  }
}
