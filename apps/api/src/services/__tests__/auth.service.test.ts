import { AuthService } from "../auth.service";
import {
  setupTestDatabase,
  teardownTestDatabase,
  clearTestDatabase,
} from "../../__tests__/helpers/testDb";

const authService = new AuthService();

beforeAll(async () => {
  await setupTestDatabase();
});

afterAll(async () => {
  await teardownTestDatabase();
});

afterEach(async () => {
  await clearTestDatabase();
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

      // Tokens should be non-empty strings
      expect(typeof result.accessToken).toBe("string");
      expect(result.accessToken.length).toBeGreaterThan(0);
      expect(typeof result.refreshToken).toBe("string");
      expect(result.refreshToken.length).toBeGreaterThan(0);
    });

    it("should throw error if user already exists", async () => {
      await authService.register("test@example.com", "password123");

      await expect(
        authService.register("test@example.com", "password456"),
      ).rejects.toThrow("Email already registered");
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
      // Create test user
      await authService.register("test@example.com", "password123");
    });

    it("should login with correct credentials", async () => {
      const result = await authService.login("test@example.com", "password123");

      expect(result.user.email).toBe("test@example.com");
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw error for incorrect password", async () => {
      await expect(
        authService.login("test@example.com", "wrongpassword"),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        authService.login("nonexistent@example.com", "password123"),
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("verifyToken", () => {
    it("should verify valid token", async () => {
      const { accessToken, user } = await authService.register(
        "test@example.com",
        "password123",
      );

      const decoded = authService.verifyToken(accessToken);

      expect(decoded.userId).toBe(user.id);
      expect(decoded.email).toBe(user.email);
    });

    it("should throw error for invalid token", () => {
      expect(() => {
        authService.verifyToken("invalid-token");
      }).toThrow();
    });
  });

  describe("getCurrentUser", () => {
    it("should get user by id", async () => {
      const { user } = await authService.register(
        "test@example.com",
        "password123",
      );

      const currentUser = await authService.getCurrentUser(user.id);

      expect(currentUser).toBeDefined();
      expect(currentUser.email).toBe("test@example.com");
      expect(currentUser.id).toBe(user.id);
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        authService.getCurrentUser("non-existent-id"),
      ).rejects.toThrow("User not found");
    });
  });
});
