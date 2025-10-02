import { Request, Response, NextFunction } from "express";
import { ApplicationStatus } from "../models/Application";

// Validate create application request
export function validateCreateApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { company, role, status, link, deadline } = req.body;

  const errors: string[] = [];

  // Required fields
  if (!company || typeof company !== "string" || company.trim() === "") {
    errors.push("Company is required");
  }

  if (!role || typeof role !== "string" || role.trim() === "") {
    errors.push("Role is required");
  }

  // Optional: status validation
  if (status && !Object.values(ApplicationStatus).includes(status)) {
    errors.push(
      `Status must be one of: ${Object.values(ApplicationStatus).join(", ")}`,
    );
  }

  // Optional: link validation
  if (link && typeof link === "string") {
    if (!/^https?:\/\/.+/.test(link)) {
      errors.push("Link must be a valid URL starting with http:// or https://");
    }
  }

  // Optional: deadline validation
  if (deadline && typeof deadline === "string") {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) {
      errors.push("Deadline must be a valid date");
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  next();
}

// Validate update application request
export function validateUpdateApplication(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { company, role, status, link, deadline } = req.body;

  const errors: string[] = [];

  // All fields optional for update, but must be valid if provided
  if (company !== undefined) {
    if (typeof company !== "string" || company.trim() === "") {
      errors.push("Company must be a non-empty string");
    }
  }

  if (role !== undefined) {
    if (typeof role !== "string" || role.trim() === "") {
      errors.push("Role must be a non-empty string");
    }
  }

  if (status !== undefined) {
    if (!Object.values(ApplicationStatus).includes(status)) {
      errors.push(
        `Status must be one of: ${Object.values(ApplicationStatus).join(", ")}`,
      );
    }
  }

  if (link !== undefined && link !== null) {
    if (typeof link !== "string" || !/^https?:\/\/.+/.test(link)) {
      errors.push("Link must be a valid URL starting with http:// or https://");
    }
  }

  if (deadline !== undefined && deadline !== null) {
    const date = new Date(deadline);
    if (isNaN(date.getTime())) {
      errors.push("Deadline must be a valid date");
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  next();
}

// Validate query parameters for GET /applications
export function validateApplicationFilters(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { status, deadlineSoon } = req.query;

  const errors: string[] = [];

  if (
    status &&
    !Object.values(ApplicationStatus).includes(status as ApplicationStatus)
  ) {
    errors.push(
      `Status must be one of: ${Object.values(ApplicationStatus).join(", ")}`,
    );
  }

  if (deadlineSoon !== undefined) {
    if (
      deadlineSoon !== "1" &&
      deadlineSoon !== "true" &&
      deadlineSoon !== "0" &&
      deadlineSoon !== "false"
    ) {
      errors.push("deadlineSoon must be a boolean (1, true, 0, or false)");
    }
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  next();
}
