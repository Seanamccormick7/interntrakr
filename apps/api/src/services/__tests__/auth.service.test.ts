import mongoose from "mongoose";
import { AuthService } from "../auth.service";
import { User } from "../../models/User";

const authService = new AuthService();

beforeAll(async () => {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/interntrackr_test";
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe("AuthService", () => {
  describe("register", () => {
    it("should create a new user with hashed password", async () => {
      const result = await authService.register(
        "test@example.com",
        "password123",
      );

      expect(result.user.email).toBe("test@example.com");
      expect(result.user.id).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // Verify password is hashed
      const user = await User.findById(result.user.id).select("+password");
      expect(user?.password).not.toBe("password123");
      expect(user?.password).toContain("$2"); // bcrypt hash prefix
    });

    it("should throw error if user already exists", async () => {
      await authService.register("test@example.com", "password123");

      await expect(
        authService.register("test@example.com", "password456"),
      ).rejects.toThrow("User already exists");
    });

    it("should generate valid JWT tokens", async () => {
      const result = await authService.register(
        "test@example.com",
        "password123",
      );

      // Tokens should be non-empty strings
      expect(typeof result.accessToken).toBe("string");
      expect(result.accessToken.length).toBeGreaterThan(0);
      expect(typeof result.refreshToken).toBe("string");
      expect(result.refreshToken.length).toBeGreaterThan(0);
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      // Clear ALL users first to prevent conflicts
      await User.deleteMany({});
      await authService.register("test@example.com", "password123");
    });

    it("should login with correct credentials", async () => {
      const result = await authService.login("test@example.com", "password123");

      expect(result.user.email).toBe("test@example.com");
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        authService.login("nonexistent@example.com", "password123"),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw error for incorrect password", async () => {
      await expect(
        authService.login("test@example.com", "wrongpassword"),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should not expose password in response", async () => {
      const result = await authService.login("test@example.com", "password123");

      // Check that password field doesn't exist on the returned user object
      expect((result.user as Record<string, unknown>).password).toBeUndefined();
    });
  });
});
