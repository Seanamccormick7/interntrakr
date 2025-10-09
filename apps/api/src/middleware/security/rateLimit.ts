import rateLimit from "express-rate-limit";
import { env } from "../../config/env";

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: env.RATE_API_WINDOW_MS, // e.g., 60s
  max: env.RATE_API_MAX, // e.g., 120 req/min per IP
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests, please try again later." },
  // Skip failed requests (don't count them against the limit)
  skipFailedRequests: false,
  // Skip successful requests (only count them)
  skipSuccessfulRequests: false,
  // Skip health checks and monitoring endpoints
  skip: (req) => req.path === "/health" || req.method === "OPTIONS",
  // Validate trust proxy setting
  validate: { trustProxy: false }, // Disable validation warning for now
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: env.RATE_AUTH_WINDOW_MS, // e.g., 60s
  max: env.RATE_AUTH_MAX, // e.g., 10 req/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts. Slow down." },
  skipFailedRequests: false,
  skipSuccessfulRequests: false,
  validate: { trustProxy: false }, // Disable validation warning for now
});
