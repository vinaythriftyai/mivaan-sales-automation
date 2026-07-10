import { z } from "zod";

const signupRoleSchema = z.enum([
  "CAM",
  "HOD",
  "SALES",
  "SYSTEM_ADMIN",
  "ACCOUNTS",
]);

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),

    email: z
      .string()
      .trim()
      .email("Enter a valid email address")
      .transform((value) => value.toLowerCase()),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .max(100, "Password cannot exceed 100 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),

    confirmPassword: z.string(),

    role: signupRoleSchema.optional(),

    territory: z
      .string()
      .trim()
      .max(100, "Territory cannot exceed 100 characters")
      .optional(),

    division: z
      .string()
      .trim()
      .max(100, "Division cannot exceed 100 characters")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((value) => value.toLowerCase()),

  password: z.string().min(8, "Password must contain at least 8 characters"),
});