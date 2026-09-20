import { z } from "zod";

export const triggerAnalysisSchema = z.object({
  body: z.object({
    astronautId: z.string().min(1, "Astronaut ID is required").trim(),
    healthDataId: z.string().optional(),
    heartRate: z.coerce.number().min(30).max(220).optional(),
    spo2: z.coerce.number().min(50).max(100).optional(),
    sleep: z.coerce.number().min(0).max(24).optional(),
    activity: z.coerce.number().min(0).max(100).optional(),
  }),
});

export const getAstronautAnalysisSchema = z.object({
  params: z.object({
    astronautId: z.string().min(1, "Astronaut ID is required"),
  }),
});
