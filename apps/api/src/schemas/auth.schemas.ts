import { z } from "zod";

// Register schema
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email format")
      .max(255, "Email must be less than 255 characters"),
    password: z
      .string({ message: "Password is required" })
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must be less than 100 characters"),
  }),
});

// Login schema
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ message: "Email is required" })
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .email("Invalid email format"),
    password: z
      .string({ message: "Password is required" })
      .min(1, "Password is required"),
  }),
});

// Export types for use in controllers
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
