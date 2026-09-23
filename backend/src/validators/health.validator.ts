import { z } from "zod";

export const createHealthDataSchema = z.object({
  body: z.object({
    astronautId: z.string().trim().optional(),
    heartRate: z.coerce
      .number()
      .min(30, "Heart rate must be between 30 and 220 BPM")
      .max(220, "Heart rate must be between 30 and 220 BPM"),
    spo2: z.coerce
      .number()
      .min(50, "SpO2 must be between 50% and 100%")
      .max(100, "SpO2 must be between 50% and 100%"),
    sleep: z.coerce
      .number()
      .min(0, "Sleep duration must be between 0 and 24 hours")
      .max(24, "Sleep duration must be between 0 and 24 hours"),
    activity: z.coerce
      .number()
      .min(0, "Activity level must be between 0% and 100%")
      .max(100, "Activity level must be between 0% and 100%"),
    ecg: z.object({ rhythm: z.string().max(40).optional(), arrhythmiaDetected: z.coerce.boolean().optional(), qtIntervalMs: z.coerce.number().min(0).max(1000).optional() }).optional(),
    bloodPressure: z.object({ systolic: z.coerce.number().min(50).max(260).optional(), diastolic: z.coerce.number().min(20).max(180).optional() }).optional(),
    coreTemperatureC: z.coerce.number().min(30).max(45).optional(),
    respirationRate: z.coerce.number().min(0).max(80).optional(),
    microgravityStressIndex: z.coerce.number().min(0).max(100).optional(),
    notes: z.string().trim().optional(),
    timestamp: z.coerce.date().optional(),
    source: z.enum(["manual", "sensor", "csv"]).default("manual").optional(),
  }),
});

export const getAstronautHealthSchema = z.object({
  params: z.object({
    astronautId: z.string().min(1, "Astronaut ID is required"),
  }),
  query: z
    .object({
      limit: z.coerce.number().min(1).max(500).default(50).optional(),
      page: z.coerce.number().min(1).default(1).optional(),
    })
    .optional(),
});
