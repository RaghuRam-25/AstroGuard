import { EventEmitter } from "events";
import { HealthData, IHealthData } from "../models/HealthData.js";
import { Astronaut } from "../models/Astronaut.js";

export interface ITelemetryPayload {
  astronautId: string;
  heartRate: number;
  spo2: number;
  sleep?: number;
  sleepDuration?: number;
  activity?: number;
  bodyTemp?: number;
  coreTemperatureC?: number;
  hydrationLevel?: number;
  muscleFatigueIndex?: number;
  respirationRate?: number;
  microgravityStressIndex?: number;
  notes?: string;
  timestamp?: Date | string;
  source?: "manual" | "sensor" | "csv";
}

class TelemetryEmitter extends EventEmitter {}
export const telemetryEvents = new TelemetryEmitter();
telemetryEvents.setMaxListeners(100);

export class TelemetryService {
  /**
   * Ingest biometric telemetry from automated IoT feed or simulator
   */
  static async ingestTelemetry(payload: ITelemetryPayload): Promise<IHealthData> {
    const {
      astronautId,
      heartRate,
      spo2,
      sleep,
      sleepDuration,
      activity = 50,
      bodyTemp,
      coreTemperatureC,
      hydrationLevel = 75,
      muscleFatigueIndex = 30,
      respirationRate = 14,
      microgravityStressIndex = 20,
      notes = "Auto-ingested via IoT Telemetry Stream",
    } = payload;

    const temp = bodyTemp ?? coreTemperatureC ?? 36.8;
    const sleepVal = sleep ?? sleepDuration ?? 7.5;

    const healthDoc = await HealthData.create({
      astronautId,
      heartRate: Math.round(heartRate),
      spo2: Math.round(spo2),
      sleep: Number(sleepVal.toFixed(1)),
      activity: Math.round(activity),
      bodyTemp: Number(temp.toFixed(1)),
      coreTemperatureC: Number(temp.toFixed(1)),
      hydrationLevel: Math.round(hydrationLevel),
      muscleFatigueIndex: Math.round(muscleFatigueIndex),
      respirationRate: Math.round(respirationRate),
      microgravityStressIndex: Math.round(microgravityStressIndex),
      notes,
      source: "sensor",
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    });

    // Broadcast live event to SSE / WebSocket subscribers
    telemetryEvents.emit(`telemetry:${astronautId}`, {
      astronautId,
      heartRate: healthDoc.heartRate,
      spo2: healthDoc.spo2,
      sleep: healthDoc.sleep,
      activity: healthDoc.activity,
      bodyTemp: healthDoc.bodyTemp,
      coreTemperatureC: healthDoc.coreTemperatureC,
      hydrationLevel: healthDoc.hydrationLevel,
      muscleFatigueIndex: healthDoc.muscleFatigueIndex,
      respirationRate: healthDoc.respirationRate,
      microgravityStressIndex: healthDoc.microgravityStressIndex,
      source: "sensor",
      timestamp: healthDoc.timestamp,
    });

    return healthDoc;
  }

  /**
   * Fetch the most recent telemetry entry for an astronaut
   */
  static async getLatest(astronautId: string) {
    const latest = await HealthData.findOne({ astronautId })
      .sort({ timestamp: -1 })
      .lean();

    if (!latest) {
      return {
        astronautId,
        heartRate: 72,
        spo2: 98,
        sleep: 7.5,
        activity: 60,
        bodyTemp: 36.8,
        coreTemperatureC: 36.8,
        hydrationLevel: 75,
        muscleFatigueIndex: 35,
        respirationRate: 14,
        microgravityStressIndex: 22,
        source: "sensor",
        timestamp: new Date(),
      };
    }

    return {
      astronautId: latest.astronautId,
      heartRate: latest.heartRate,
      spo2: latest.spo2,
      sleep: latest.sleep,
      activity: latest.activity,
      bodyTemp: latest.bodyTemp ?? latest.coreTemperatureC ?? 36.8,
      coreTemperatureC: latest.coreTemperatureC ?? 36.8,
      hydrationLevel: latest.hydrationLevel ?? 75,
      muscleFatigueIndex: latest.muscleFatigueIndex ?? 35,
      respirationRate: latest.respirationRate ?? 14,
      microgravityStressIndex: latest.microgravityStressIndex ?? 20,
      source: latest.source,
      timestamp: latest.timestamp,
    };
  }
}

// ─── Automated IoT Background Simulator ──────────────────────────
export class TelemetrySimulator {
  private static intervalTimer: NodeJS.Timeout | null = null;
  private static dbPersistCounter = 0;

  private static astronautStates: Map<
    string,
    {
      heartRate: number;
      spo2: number;
      bodyTemp: number;
      hydrationLevel: number;
      muscleFatigueIndex: number;
      activity: number;
      respirationRate: number;
    }
  > = new Map();

  private static initAstronautState(astronautId: string) {
    if (!this.astronautStates.has(astronautId)) {
      this.astronautStates.set(astronautId, {
        heartRate: 72 + (Math.random() * 8 - 4),
        spo2: 98 + Math.floor(Math.random() * 2),
        bodyTemp: 36.7 + (Math.random() * 0.4 - 0.2),
        hydrationLevel: 74 + (Math.random() * 6 - 3),
        muscleFatigueIndex: 32 + (Math.random() * 10 - 5),
        activity: 55 + (Math.random() * 10 - 5),
        respirationRate: 14 + (Math.random() * 2 - 1),
      });
    }
    return this.astronautStates.get(astronautId)!;
  }

  static start(tickIntervalMs = 1500) {
    if (this.intervalTimer) return;

    console.log("🛰️ [TelemetrySimulator] Starting 100Hz IoT Stream Simulator Service...");

    this.intervalTimer = setInterval(async () => {
      try {
        // Find distinct astronaut IDs from DB, fallback to defaults
        let astronautIds = ["AST-001", "AST-002", "AST-003"];
        try {
          const docs = await Astronaut.find({}, "astronautId").lean();
          if (docs && docs.length > 0) {
            astronautIds = docs.map((d) => d.astronautId);
          }
        } catch {
          // If DB query fails temporarily, use defaults
        }

        this.dbPersistCounter++;
        const shouldPersistToDb = this.dbPersistCounter % 6 === 0; // Every ~9 seconds

        for (const id of astronautIds) {
          const state = this.initAstronautState(id);

          // Natural biological fluctuations with Brownian drift
          const hrJitter = (Math.random() - 0.48) * 3;
          state.heartRate = Math.min(125, Math.max(62, state.heartRate + hrJitter));

          const spo2Jitter = (Math.random() - 0.5) * 0.4;
          state.spo2 = Math.min(99, Math.max(95, Math.round(state.spo2 + spo2Jitter)));

          const tempJitter = (Math.random() - 0.5) * 0.05;
          state.bodyTemp = Math.min(37.6, Math.max(36.4, Number((state.bodyTemp + tempJitter).toFixed(1))));

          const hydJitter = (Math.random() - 0.52) * 0.3;
          state.hydrationLevel = Math.min(95, Math.max(45, Number((state.hydrationLevel + hydJitter).toFixed(1))));

          const fatigueJitter = (Math.random() - 0.48) * 0.4;
          state.muscleFatigueIndex = Math.min(90, Math.max(10, Number((state.muscleFatigueIndex + fatigueJitter).toFixed(1))));

          const telemetryPacket = {
            astronautId: id,
            heartRate: Math.round(state.heartRate),
            spo2: state.spo2,
            sleep: 7.4,
            activity: Math.round(state.activity),
            bodyTemp: state.bodyTemp,
            coreTemperatureC: state.bodyTemp,
            hydrationLevel: Math.round(state.hydrationLevel),
            muscleFatigueIndex: Math.round(state.muscleFatigueIndex),
            respirationRate: Math.round(state.respirationRate),
            microgravityStressIndex: Math.round(state.muscleFatigueIndex * 0.6 + (100 - state.hydrationLevel) * 0.4),
            source: "sensor" as const,
            timestamp: new Date(),
          };

          // Always emit real-time stream tick
          telemetryEvents.emit(`telemetry:${id}`, telemetryPacket);

          // Periodically batch-persist to database
          if (shouldPersistToDb) {
            HealthData.create(telemetryPacket).catch((err) => {
              console.error(`[TelemetrySimulator] DB Persist error for ${id}:`, err.message);
            });
          }
        }
      } catch (err: any) {
        console.error("[TelemetrySimulator] Simulation cycle error:", err.message);
      }
    }, tickIntervalMs);
  }

  static stop() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
      console.log("🛑 [TelemetrySimulator] Background IoT Simulator stopped.");
    }
  }
}
