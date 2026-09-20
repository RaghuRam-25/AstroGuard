import { z } from "zod";

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    role: z.enum(["astronaut", "medical_officer", "mission_control", "admin"]),
    astronautId: z.string().trim().optional(),
    assignedAstronautIds: z.array(z.string()).optional(),
    missionIds: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    name: z.string().min(2).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    role: z.enum(["astronaut", "medical_officer", "mission_control", "admin"]).optional(),
    astronautId: z.string().trim().optional(),
    assignedAstronautIds: z.array(z.string()).optional(),
    missionIds: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).optional(),
  }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});
