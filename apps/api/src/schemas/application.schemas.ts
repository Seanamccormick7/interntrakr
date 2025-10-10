import { z } from "zod";
import { ApplicationStatus } from "../models/Application";

// URL validation regex
const urlRegex = /^https?:\/\/.+/;

// Create application schema
export const createApplicationSchema = z.object({
  body: z.object({
    company: z
      .string({ message: "Company is required" })
      .trim()
      .min(1, "Company is required")
      .max(200, "Company must be less than 200 characters"),
    role: z
      .string({ message: "Role is required" })
      .trim()
      .min(1, "Role is required")
      .max(200, "Role must be less than 200 characters"),
    status: z
      .nativeEnum(ApplicationStatus)
      .optional()
      .refine(
        (val) =>
          val === undefined || Object.values(ApplicationStatus).includes(val),
        {
          message: `Status must be one of: ${Object.values(ApplicationStatus).join(", ")}`,
        },
      ),
    location: z.string().trim().max(200).optional(),
    link: z
      .string()
      .trim()
      .regex(
        urlRegex,
        "Link must be a valid URL starting with http:// or https://",
      )
      .max(500, "Link must be less than 500 characters")
      .optional()
      .or(z.literal("")),
    deadline: z
      .string()
      .datetime({ message: "Deadline must be a valid ISO date" })
      .or(
        z
          .string()
          .date({ message: "Deadline must be a valid date (YYYY-MM-DD)" }),
      )
      .optional()
      .or(z.literal("")),
    notes: z
      .string()
      .trim()
      .max(2000, "Notes must be less than 2000 characters")
      .optional(),
    tags: z
      .array(z.string().trim().max(50))
      .max(20, "Maximum 20 tags allowed")
      .optional(),
  }),
});

// Update application schema - all fields optional
export const updateApplicationSchema = z.object({
  body: z.object({
    company: z
      .string()
      .trim()
      .min(1, "Company must be a non-empty string")
      .max(200, "Company must be less than 200 characters")
      .optional(),
    role: z
      .string()
      .trim()
      .min(1, "Role must be a non-empty string")
      .max(200, "Role must be less than 200 characters")
      .optional(),
    status: z
      .nativeEnum(ApplicationStatus)
      .optional()
      .refine(
        (val) =>
          val === undefined || Object.values(ApplicationStatus).includes(val),
        {
          message: `Status must be one of: ${Object.values(ApplicationStatus).join(", ")}`,
        },
      ),
    location: z.string().trim().max(200).optional(),
    link: z
      .string()
      .trim()
      .regex(
        urlRegex,
        "Link must be a valid URL starting with http:// or https://",
      )
      .max(500, "Link must be less than 500 characters")
      .optional()
      .nullable(),
    deadline: z
      .string()
      .datetime({ message: "Deadline must be a valid ISO date" })
      .or(
        z
          .string()
          .date({ message: "Deadline must be a valid date (YYYY-MM-DD)" }),
      )
      .optional()
      .nullable(),
    notes: z
      .string()
      .trim()
      .max(2000, "Notes must be less than 2000 characters")
      .optional(),
    tags: z
      .array(z.string().trim().max(50))
      .max(20, "Maximum 20 tags allowed")
      .optional(),
  }),
});

// Query parameter filters schema
export const applicationFiltersSchema = z.object({
  query: z.object({
    status: z
      .nativeEnum(ApplicationStatus)
      .optional()
      .refine(
        (val) =>
          val === undefined || Object.values(ApplicationStatus).includes(val),
        {
          message: `Status must be one of: ${Object.values(ApplicationStatus).join(", ")}`,
        },
      ),
    deadlineSoon: z
      .enum(["1", "true", "0", "false"])
      .optional()
      .refine(
        (val) => val === undefined || ["1", "true", "0", "false"].includes(val),
        {
          message: "deadlineSoon must be a boolean (1, true, 0, or false)",
        },
      ),
    q: z.string().trim().max(200, "Search query too long").optional(),
  }),
});

// Export types
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationFiltersInput = z.infer<typeof applicationFiltersSchema>;
