import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

// Define the structure of validated request data
interface ValidatedRequest {
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  params?: Record<string, unknown>;
}

// Validation middleware factory
export const validate =
  (schema: ZodSchema) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse and sanitize request data
      const validated = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as ValidatedRequest;

      // Apply sanitized values back to request
      if (validated.body) req.body = validated.body;
      if (validated.query) req.query = validated.query as typeof req.query;
      if (validated.params) req.params = validated.params as typeof req.params;

      // If validation passes, continue
      next();
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        res.status(400).json({
          error: "Validation failed",
          details: errors,
        });
        return;
      }

      // Handle unexpected errors
      console.error("Validation middleware error:", error);
      res.status(500).json({
        error: "Internal server error",
      });
    }
  };
