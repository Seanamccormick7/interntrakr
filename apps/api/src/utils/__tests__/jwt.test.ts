import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateTokens,
} from "../jwt";

describe("JWT Utils", () => {
  const mockPayload = {
    userId: "123",
    email: "test@example.com",
  };

  describe("generateAccessToken", () => {
    it("should generate a valid access token", () => {
      const token = generateAccessToken(mockPayload);

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token.split(".").length).toBe(3); // JWT has 3 parts
    });

    it("should include payload data in token", () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a valid refresh token", () => {
      const token = generateRefreshToken(mockPayload);

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);
      expect(token.split(".").length).toBe(3);
    });

    it("should include payload data in token", () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });
  });

  describe("verifyToken", () => {
    it("should verify valid token", () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
    });

    it("should throw error for invalid token", () => {
      expect(() => verifyToken("invalid-token")).toThrow("Invalid token");
    });

    it("should throw error for malformed token", () => {
      expect(() => verifyToken("not.a.token")).toThrow();
    });
  });

  describe("generateTokens", () => {
    it("should generate both access and refresh tokens", () => {
      const tokens = generateTokens(mockPayload);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(typeof tokens.accessToken).toBe("string");
      expect(typeof tokens.refreshToken).toBe("string");
    });

    it("should generate different tokens", () => {
      const tokens = generateTokens(mockPayload);

      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it("should generate valid tokens", () => {
      const tokens = generateTokens(mockPayload);

      const accessDecoded = verifyToken(tokens.accessToken);
      const refreshDecoded = verifyToken(tokens.refreshToken);

      expect(accessDecoded.userId).toBe(mockPayload.userId);
      expect(refreshDecoded.userId).toBe(mockPayload.userId);
    });
  });
});
