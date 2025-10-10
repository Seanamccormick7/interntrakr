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
  maxWorkers: 1,
  setupFiles: ["<rootDir>/src/__tests__/setup.ts"],
  forceExit: true,
  detectOpenHandles: false,
};
