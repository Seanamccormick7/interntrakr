// Global test setup - runs before all tests
process.env.NODE_ENV = "test";

// Set test JWT secret
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

// Database configuration for tests
// Default to mongo unless explicitly set to postgres
process.env.DB_ENGINE = process.env.DB_ENGINE || "mongo";

// Set database URLs for tests
if (process.env.DB_ENGINE === "postgres") {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/interntrackr_test";
} else {
  process.env.MONGO_URI =
    process.env.MONGO_URI || "mongodb://localhost:27017/interntrackr_test";
}

// Redis for cache tests
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

// Increase timeout for slow tests
jest.setTimeout(30000);
