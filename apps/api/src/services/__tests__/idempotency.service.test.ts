import { IdempotencyService } from "../idempotency.service";
import { getRedisClient } from "../../config/redis";

jest.mock("../../config/redis");

const mockRedis = {
  exists: jest.fn(),
  set: jest.fn(),
};

(getRedisClient as jest.Mock).mockReturnValue(mockRedis);

describe("IdempotencyService", () => {
  let service: IdempotencyService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IdempotencyService();
  });

  describe("isAlreadySent", () => {
    it("returns false when key does not exist in Redis", async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await service.isAlreadySent(
        "user@example.com",
        "2024-01-15",
      );

      expect(result).toBe(false);
      expect(mockRedis.exists).toHaveBeenCalledWith(
        "alert:notified:user@example.com:2024-01-15",
      );
    });

    it("returns true when key already exists in Redis", async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await service.isAlreadySent(
        "user@example.com",
        "2024-01-15",
      );

      expect(result).toBe(true);
    });

    it("fails open (returns false) when Redis throws", async () => {
      mockRedis.exists.mockRejectedValue(new Error("Redis connection failed"));

      const result = await service.isAlreadySent(
        "user@example.com",
        "2024-01-15",
      );

      expect(result).toBe(false);
    });

    it("uses a different key per user", async () => {
      mockRedis.exists.mockResolvedValue(0);

      await service.isAlreadySent("alice@example.com", "2024-01-15");
      await service.isAlreadySent("bob@example.com", "2024-01-15");

      expect(mockRedis.exists).toHaveBeenCalledWith(
        "alert:notified:alice@example.com:2024-01-15",
      );
      expect(mockRedis.exists).toHaveBeenCalledWith(
        "alert:notified:bob@example.com:2024-01-15",
      );
    });

    it("uses a different key per runDate", async () => {
      mockRedis.exists.mockResolvedValue(0);

      await service.isAlreadySent("user@example.com", "2024-01-15");
      await service.isAlreadySent("user@example.com", "2024-01-16");

      expect(mockRedis.exists).toHaveBeenCalledWith(
        "alert:notified:user@example.com:2024-01-15",
      );
      expect(mockRedis.exists).toHaveBeenCalledWith(
        "alert:notified:user@example.com:2024-01-16",
      );
    });
  });

  describe("markAsSent", () => {
    it("sets the key with 25-hour TTL", async () => {
      mockRedis.set.mockResolvedValue("OK");

      await service.markAsSent("user@example.com", "2024-01-15");

      expect(mockRedis.set).toHaveBeenCalledWith(
        "alert:notified:user@example.com:2024-01-15",
        "1",
        "EX",
        90000, // 25 hours in seconds
      );
    });

    it("does not throw when Redis throws", async () => {
      mockRedis.set.mockRejectedValue(new Error("Redis connection failed"));

      await expect(
        service.markAsSent("user@example.com", "2024-01-15"),
      ).resolves.not.toThrow();
    });
  });
});
