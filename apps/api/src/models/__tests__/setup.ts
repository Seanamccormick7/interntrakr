// Global test setup
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";

// Set test timeout
jest.setTimeout(30000);
