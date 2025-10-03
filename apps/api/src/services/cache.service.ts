import { getRedisClient } from "../config/redis";

export class CacheService {
  private readonly DEFAULT_TTL = 300; // 5 minutes in seconds

  // Generate cache key with userId and query parameters
  generateKey(
    userId: string,
    queryParams: Record<string, unknown> = {},
  ): string {
    // Sort keys for consistent cache keys
    const sortedParams = Object.keys(queryParams)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = queryParams[key];
          return acc;
        },
        {} as Record<string, unknown>,
      );

    const paramsString = JSON.stringify(sortedParams);
    return `applications:${userId}:${paramsString}`;
  }

  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = getRedisClient();
      const cached = await redis.get(key);

      if (cached) {
        console.log(`Cache HIT: ${key}`);
        return JSON.parse(cached) as T;
      }

      console.log(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      console.error("Cache get error:", error);
      // If Redis fails, return null and continue without cache
      return null;
    }
  }

  // Set cached data with TTL
  async set(
    key: string,
    data: unknown,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.setex(key, ttl, JSON.stringify(data));
      console.log(`Cache SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error("Cache set error:", error);
      // If Redis fails, just log and continue
    }
  }

  // Invalidate cache for a specific user
  async invalidateUser(userId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      // Find all keys matching this user's pattern
      const pattern = `applications:${userId}:*`;
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(
          `Cache INVALIDATED: ${keys.length} keys for user ${userId}`,
        );
      }
    } catch (error) {
      console.error("Cache invalidation error:", error);
      // If Redis fails, just log and continue
    }
  }

  // Delete specific cache key
  async delete(key: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.del(key);
      console.log(`Cache DELETED: ${key}`);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  }

  // Clear all application caches (use sparingly)
  async clearAll(): Promise<void> {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys("applications:*");
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`Cache CLEARED: ${keys.length} total keys`);
      }
    } catch (error) {
      console.error("Cache clear all error:", error);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
