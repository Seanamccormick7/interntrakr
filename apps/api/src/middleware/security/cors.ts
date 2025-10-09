import cors from "cors";
import { env } from "../../config/env";

export function corsSecurity() {
  return cors({
    origin(origin, cb) {
      // Allow server-to-server (no Origin) and allow-listed frontends
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error("CORS: Origin not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-request-id"],
    credentials: true,
    maxAge: 86400, // cache preflight for 24 hours
  });
}
