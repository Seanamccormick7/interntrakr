import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    res.status(401).json({
      error: "Missing API key",
      message: "x-api-key header is required",
    });
    return;
  }

  if (apiKey !== env.INTERNAL_API_KEY) {
    res.status(403).json({
      error: "Invalid API key",
      message: "The provided API key is not valid",
    });
    return;
  }

  next();
}
