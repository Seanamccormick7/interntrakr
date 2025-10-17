import dotenv from "dotenv";
dotenv.config();

function required(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret",

  DB_ENGINE: process.env.DB_ENGINE ?? "mongo",

  MONGO_URI: process.env.MONGO_URI ?? "mongodb://localhost:27017/interntrackr",

  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/interntrackr",

  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",

  ALLOWED_ORIGINS: (
    process.env.ALLOWED_ORIGINS ?? "http://localhost:5173,http://localhost:3000"
  )
    .split(",")
    .map((s) => s.trim()),

  RATE_AUTH_WINDOW_MS: Number(process.env.RATE_AUTH_WINDOW_MS ?? 60_000),
  RATE_AUTH_MAX: Number(
    process.env.RATE_AUTH_MAX ?? (process.env.NODE_ENV === "test" ? 1000 : 10),
  ),
  RATE_API_WINDOW_MS: Number(process.env.RATE_API_WINDOW_MS ?? 60_000),
  RATE_API_MAX: Number(
    process.env.RATE_API_MAX ?? (process.env.NODE_ENV === "test" ? 10000 : 120),
  ),

  INTERNAL_API_KEY: required(
    "INTERNAL_API_KEY",
    process.env.NODE_ENV === "test" ? "test-api-key" : undefined,
  ),
};
