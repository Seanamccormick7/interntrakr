import express from "express";
import cors from "cors";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/error";
import { makeRequestLogger } from "./middleware/requestLogger";
import routes from "./routes";

export function createApp() {
  const app = express();

  // Trust proxy for proper IP and protocol detection (for x-forwarded-* headers)
  app.set("trust proxy", true);

  // Request logging early to capture all routes
  app.use(makeRequestLogger());

  // CORS configuration - allow frontend to make requests
  app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:3000"], // Allow both Vite and potential Next.js
      credentials: true, // Allow cookies/auth headers
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-request-id"], // Allow x-request-id
    }),
  );

  app.use(express.json());
  app.use(routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
