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
  JWT_SECRET: process.env.JWT_SECRET ?? "dev-secret", // replace later
  MONGO_URI: process.env.MONGO_URI ?? "mongodb://localhost:27017/interntrackr",
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379",
  DB_ENGINE: process.env.DB_ENGINE ?? "mongo"
};
