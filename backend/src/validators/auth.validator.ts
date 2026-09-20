import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").trim(),
    email: z.string().email("Invalid email address").toLowerCase().trim(),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores")
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    phone: z
      .string()
      .min(7, "Phone number must be at least 7 characters")
      .max(24, "Phone number must be at most 24 characters")
      .regex(/^[0-9+\-()\s]+$/, "Phone number contains invalid characters")
      .trim(),
    dateOfBirth: z
      .string()
      .min(1, "Date of birth is required")
      .refine((value) => {
        const parsed = new Date(value);
        return !Number.isNaN(parsed.getTime()) && parsed < new Date();
      }, "Date of birth must be a valid past date"),
    country: z.string().min(2, "Country is required").max(80).trim(),
    gender: z.enum(["female", "male", "non_binary", "prefer_not_to_say"]).optional(),
    astronautId: z.string().trim().max(40).optional(),
    profileImage: z.string().trim().max(1_500_000, "Profile image is too large").optional(),
    agreeToTerms: z.literal(true, {
      errorMap: () => ({ message: "You must agree to the terms and conditions" }),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, "Email, username, or astronaut ID is required").trim(),
    password: z.string().min(1, "Password is required"),
  }),
});
