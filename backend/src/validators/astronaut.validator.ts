import { z } from "zod";

export const createAstronautSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required").trim(),
    astronautId: z.string().min(1, "Astronaut ID is required").trim(),
    role: z.string().optional(),
    mission: z.string().min(1, "Mission is required").trim(),
    missionDay: z.number().min(0, "Mission day must be 0 or greater"),
    missionPhase: z.enum(["Transit", "Orbital Ops", "Lunar Surface", "Deep Space"]).optional(),
    status: z.enum(["Nominal", "Elevated Deviation", "Post-EVA Recovery", "Active"]).optional(),
    avatar: z.string().optional(),
  }),
});

export const getAstronautByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Astronaut identifier is required"),
  }),
});
