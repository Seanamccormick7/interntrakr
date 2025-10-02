import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface JWTPayload {
  userId: string;
  email: string;
}

// Generate access token (short-lived)
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "15m", // 15 minutes
  });
}

// Generate refresh token (long-lived)
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d", // 7 days
  });
}

// Verify token
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    }
    throw new Error("Token verification failed");
  }
}

// Generate both tokens
export function generateTokens(payload: JWTPayload) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}
