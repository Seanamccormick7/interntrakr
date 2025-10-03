import { CacheService } from "../cache.service";
import { connectRedis, disconnectRedis } from "../../config/redis";

const cacheService = new CacheService();

beforeAll(async () => {
  await connectRedis();
});

afterAll(async () => {
  await cacheService.clearAll();
  await disconnectRedis();
  // Add small delay to ensure cleanup
  await new Promise((resolve) => setTimeout(resolve, 100));
});

afterEach(async () => {
  // Clean up all test cache keys
  await cacheService.clearAll();
});

describe("CacheService", () => {
  describe("generateKey", () => {
    it("should generate consistent keys for same inputs", () => {
      const userId = "user123";
      const params = { status: "APPLIED", q: "google" };

      const key1 = cacheService.generateKey(userId, params);
      const key2 = cacheService.generateKey(userId, params);

      expect(key1).toBe(key2);
    });

    it("should generate same key regardless of parameter order", () => {
      const userId = "user123";
      const params1 = { status: "APPLIED", q: "google" };
      const params2 = { q: "google", status: "APPLIED" };

      const key1 = cacheService.generateKey(userId, params1);
      const key2 = cacheService.generateKey(userId, params2);

      expect(key1).toBe(key2);
    });

    it("should generate different keys for different users", () => {
      const params = { status: "APPLIED" };

      const key1 = cacheService.generateKey("user1", params);
      const key2 = cacheService.generateKey("user2", params);

      expect(key1).not.toBe(key2);
    });

    it("should generate different keys for different parameters", () => {
      const userId = "user123";

      const key1 = cacheService.generateKey(userId, { status: "APPLIED" });
      const key2 = cacheService.generateKey(userId, { status: "INTERVIEW" });

      expect(key1).not.toBe(key2);
    });
  });

  describe("get and set", () => {
    it("should store and retrieve data", async () => {
      const key = "test:key";
      const data = { company: "Google", role: "SWE" };

      await cacheService.set(key, data);
      const retrieved = await cacheService.get(key);

      expect(retrieved).toEqual(data);
    });

    it("should return null for non-existent key", async () => {
      const result = await cacheService.get("nonexistent:key");
      expect(result).toBeNull();
    });

    it("should handle complex objects", async () => {
      const key = "test:complex";
      const data = {
        id: "123",
        nested: {
          array: [1, 2, 3],
          object: { a: 1, b: 2 },
        },
        date: new Date().toISOString(),
      };

      await cacheService.set(key, data);
      const retrieved = await cacheService.get(key);

      expect(retrieved).toEqual(data);
    });

    it("should expire data after TTL", async () => {
      const key = "test:ttl";
      const data = { test: "data" };

      // Set with 1 second TTL
      await cacheService.set(key, data, 1);

      // Should exist immediately
      let retrieved = await cacheService.get(key);
      expect(retrieved).toEqual(data);

      // Wait 1.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Should be expired
      retrieved = await cacheService.get(key);
      expect(retrieved).toBeNull();
    });
  });

  describe("invalidateUser", () => {
    it("should remove all keys for a user", async () => {
      const userId = "user123";

      // Create multiple cache entries for the user
      const key1 = cacheService.generateKey(userId, { status: "APPLIED" });
      const key2 = cacheService.generateKey(userId, { status: "INTERVIEW" });
      const key3 = cacheService.generateKey(userId, {});

      await cacheService.set(key1, { data: "1" });
      await cacheService.set(key2, { data: "2" });
      await cacheService.set(key3, { data: "3" });

      // Verify all exist
      expect(await cacheService.get(key1)).not.toBeNull();
      expect(await cacheService.get(key2)).not.toBeNull();
      expect(await cacheService.get(key3)).not.toBeNull();

      // Invalidate user's cache
      await cacheService.invalidateUser(userId);

      // All should be gone
      expect(await cacheService.get(key1)).toBeNull();
      expect(await cacheService.get(key2)).toBeNull();
      expect(await cacheService.get(key3)).toBeNull();
    });

    it("should not affect other users' caches", async () => {
      const user1 = "user1";
      const user2 = "user2";

      const key1 = cacheService.generateKey(user1, {});
      const key2 = cacheService.generateKey(user2, {});

      await cacheService.set(key1, { data: "user1" });
      await cacheService.set(key2, { data: "user2" });

      // Invalidate only user1
      await cacheService.invalidateUser(user1);

      // User1 cache should be gone, user2 should remain
      expect(await cacheService.get(key1)).toBeNull();
      expect(await cacheService.get(key2)).toEqual({ data: "user2" });
    });
  });

  describe("delete", () => {
    it("should delete specific key", async () => {
      const key = "test:delete";
      await cacheService.set(key, { data: "test" });

      expect(await cacheService.get(key)).not.toBeNull();

      await cacheService.delete(key);

      expect(await cacheService.get(key)).toBeNull();
    });
  });

  describe("clearAll", () => {
    it("should clear all application caches", async () => {
      // Create multiple cache entries
      await cacheService.set(cacheService.generateKey("user1", {}), {
        data: "1",
      });
      await cacheService.set(cacheService.generateKey("user2", {}), {
        data: "2",
      });

      // Clear all
      await cacheService.clearAll();

      // All should be gone
      expect(
        await cacheService.get(cacheService.generateKey("user1", {})),
      ).toBeNull();
      expect(
        await cacheService.get(cacheService.generateKey("user2", {})),
      ).toBeNull();
    });
  });
});
