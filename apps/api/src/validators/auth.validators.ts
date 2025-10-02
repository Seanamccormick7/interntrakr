import { Request, Response, NextFunction } from "express";

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Validate registration input
export function validateRegister(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { email, password } = req.body;

  const errors: string[] = [];

  // Email validation
  if (!email || typeof email !== "string") {
    errors.push("Email is required");
  } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push("Invalid email format");
  }

  // Password validation
  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  } else if (password.length < 6) {
    errors.push("Password must be at least 6 characters");
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  next();
}

// Validate login input
export function validateLogin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { email, password } = req.body;

  const errors: string[] = [];

  if (!email || typeof email !== "string") {
    errors.push("Email is required");
  }

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
  }

  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", details: errors });
    return;
  }

  next();
}
