import { z } from "zod";

export const getAlertsSchema = z.object({
  query: z
    .object({
      severity: z.enum(["All", "Normal", "Watch", "Warning", "Critical"]).optional(),
      resolved: z.enum(["true", "false"]).optional(),
      limit: z.coerce.number().min(1).max(200).optional(),
    })
    .optional(),
});

export const getAstronautAlertsSchema = z.object({
  params: z.object({
    astronautId: z.string().min(1, "Astronaut ID is required"),
  }),
});

export const resolveAlertSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Alert ID is required"),
  }),
});
