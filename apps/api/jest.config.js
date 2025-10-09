module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/__tests__/**",
  ],
  testTimeout: 30000,
  maxWorkers: 1, // run tests one at a time
  setupFiles: ["<rootDir>/src/__tests__/setup.ts"], // Set NODE_ENV=test
};
