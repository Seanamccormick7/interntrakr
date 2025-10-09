import express from "express";
import { env } from "./config/env";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/error";
import { makeRequestLogger } from "./middleware/requestLogger";
import { helmetSecurity } from "./middleware/security/helmet";
import { corsSecurity } from "./middleware/security/cors";
import { apiLimiter, authLimiter } from "./middleware/security/rateLimit";
import routes from "./routes";

export function createApp() {
  const app = express();

  // Trust proxy for proper IP and protocol detection (for x-forwarded-* headers)
  // Use 'loopback' for local dev, or number of proxies in production (e.g., 1 for ALB)
  app.set("trust proxy", env.NODE_ENV === "production" ? 1 : "loopback");

  // Parse JSON early
  app.use(express.json());

  // Request logging early to capture all routes (including security rejections)
  app.use(makeRequestLogger());

  // Security middlewares
  app.use(corsSecurity());
  app.use(helmetSecurity());

  // Rate limiting - apply to specific route prefixes
  app.use("/auth", authLimiter); // Stricter limits for auth endpoints
  app.use("/applications", apiLimiter); // General API limits
  app.use("/recommendations", apiLimiter); // General API limits

  // Application routes
  app.use(routes);

  // Error handlers (must be last)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
