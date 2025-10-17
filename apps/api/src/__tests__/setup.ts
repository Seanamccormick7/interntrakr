process.env.NODE_ENV = "test";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "test-api-key";

process.env.DB_ENGINE = process.env.DB_ENGINE || "mongo";

if (process.env.DB_ENGINE === "postgres") {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/interntrackr_test";
} else {
  process.env.MONGO_URI =
    process.env.MONGO_URI || "mongodb://localhost:27017/interntrackr_test";
}

process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

jest.setTimeout(30000);
