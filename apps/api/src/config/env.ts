import dotenv from "dotenv";
dotenv.config();

// Helper function for required env vars (currently unused but kept for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function required(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret", // replace later
  MONGO_URI: process.env.MONGO_URI ?? "mongodb://localhost:27017/interntrackr",
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  DB_ENGINE: process.env.DB_ENGINE ?? "mongo",

  // Security configuration
  ALLOWED_ORIGINS: (
    process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://localhost:3000"
  )
    .split(",")
    .map((s) => s.trim()),

  // Rate limiting configuration
  // In test environment, use higher limits to avoid flaky tests
  RATE_AUTH_WINDOW_MS: Number(process.env.RATE_AUTH_WINDOW_MS ?? 60_000), // 1 minute
  RATE_AUTH_MAX: Number(
    process.env.RATE_AUTH_MAX ?? (process.env.NODE_ENV === "test" ? 1000 : 10),
  ), // 10 requests per minute (1000 in tests)
  RATE_API_WINDOW_MS: Number(process.env.RATE_API_WINDOW_MS ?? 60_000), // 1 minute
  RATE_API_MAX: Number(
    process.env.RATE_API_MAX ?? (process.env.NODE_ENV === "test" ? 10000 : 120),
  ), // 120 requests per minute (10000 in tests)
};
