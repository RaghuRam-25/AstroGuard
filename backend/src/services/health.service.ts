import { HealthData, IHealthData } from "../models/HealthData.js";
import { MLService } from "./ml.service.js";
import { AnalysisService, FullAnalysisResult } from "./analysis.service.js";
import { Astronaut } from "../models/Astronaut.js";

export interface IngestHealthInput {
  astronautId: string;
  heartRate: number;
  spo2: number;
  sleep: number;
  activity: number;
  ecg?: IHealthData["ecg"];
  bloodPressure?: IHealthData["bloodPressure"];
  coreTemperatureC?: number;
  respirationRate?: number;
  microgravityStressIndex?: number;
  notes?: string;
  source?: "manual" | "sensor" | "csv";
  timestamp?: Date;
}

export interface IngestHealthResponse {
  health: IHealthData;
  analysis: FullAnalysisResult["analysis"];
  alert: FullAnalysisResult["alert"];
}

export class HealthService {
  /**
   * Ingest health telemetry data, execute ML anomaly pipeline, baseline comparison, and alerts
   */
  public static async ingestHealthData(input: IngestHealthInput): Promise<IngestHealthResponse> {
    // 1. Verify or ensure astronaut exists
    const astronautExists = await Astronaut.findOne({ astronautId: input.astronautId });
    if (!astronautExists) {
      // Auto-register astronaut profile if not found
      await Astronaut.create({
        name: input.astronautId === "AST-001" ? "Alex Morgan" : input.astronautId === "AST-002" ? "Sarah Chen" : "James Wilson",
        astronautId: input.astronautId,
        mission: "Ares Mission 01",
        missionDay: 142,
        status: "Active",
      });
    }

    // 2. Save health data to MongoDB
    const healthDoc = await HealthData.create({
      astronautId: input.astronautId,
      heartRate: input.heartRate,
      spo2: input.spo2,
      sleep: input.sleep,
      activity: input.activity,
      ecg: input.ecg,
      bloodPressure: input.bloodPressure,
      coreTemperatureC: input.coreTemperatureC,
      respirationRate: input.respirationRate,
      microgravityStressIndex: input.microgravityStressIndex,
      notes: input.notes || "",
      source: input.source || "manual",
      timestamp: input.timestamp || new Date(),
    });

    // 3. Send relevant data to Python ML service
    const mlResult = await MLService.predictAnomaly({
      heartRate: input.heartRate,
      spo2: input.spo2,
      sleep: input.sleep,
      activity: input.activity,
    });

    // 4. Calculate Baselines, Contributors, Explanations, Recommendations, Alerts and Save Analysis
    const { analysis, alert } = await AnalysisService.processAndSaveAnalysis({
      astronautId: input.astronautId,
      heartRate: input.heartRate,
      spo2: input.spo2,
      sleep: input.sleep,
      activity: input.activity,
      healthDataId: healthDoc._id,
      mlResult,
    });

    return {
      health: healthDoc,
      analysis,
      alert,
    };
  }

  /**
   * Get health data history for an astronaut with pagination
   */
  public static async getHealthData(
    astronautId: string,
    options: { limit?: number; page?: number } = {}
  ): Promise<{ data: IHealthData[]; total: number; page: number; totalPages: number }> {
    const limit = options.limit || 50;
    const page = options.page || 1;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      HealthData.find({ astronautId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      HealthData.countDocuments({ astronautId }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get the latest health telemetry reading for an astronaut
   */
  public static async getLatestHealthData(astronautId: string): Promise<IHealthData | null> {
    return await HealthData.findOne({ astronautId }).sort({ timestamp: -1 });
  }
}
