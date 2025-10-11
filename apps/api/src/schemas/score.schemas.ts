import { z } from "zod";

// Score request schema
export const scoreRequestSchema = z.object({
  body: z.object({
    resumeKeywords: z
      .array(z.string().trim().min(1, "Keywords cannot be empty strings"), {
        message: "resumeKeywords is required",
      })
      .min(1, "resumeKeywords must contain at least one keyword")
      .max(100, "Maximum 100 keywords allowed"),
    jobDescription: z
      .string({ message: "jobDescription is required" })
      .trim()
      .min(1, "jobDescription cannot be empty")
      .max(10000, "jobDescription must be less than 10000 characters"),
    company: z
      .string({ message: "company is required" })
      .trim()
      .min(1, "company cannot be empty")
      .max(200, "company must be less than 200 characters"),
    role: z
      .string({ message: "role is required" })
      .trim()
      .min(1, "role cannot be empty")
      .max(200, "role must be less than 200 characters"),
  }),
});

// Export type
export type ScoreRequestInput = z.infer<typeof scoreRequestSchema>;
