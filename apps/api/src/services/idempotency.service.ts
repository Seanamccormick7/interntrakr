import { getRedisClient } from "../config/redis";

const TTL_SECONDS = 25 * 60 * 60; // 25 hours — survives past midnight, expires before next run
const KEY_PREFIX = "alert:notified";

export class IdempotencyService {
  private key(email: string, runDate: string): string {
    return `${KEY_PREFIX}:${email}:${runDate}`;
  }

  async isAlreadySent(email: string, runDate: string): Promise<boolean> {
    try {
      const redis = getRedisClient();
      const exists = await redis.exists(this.key(email, runDate));
      return exists === 1;
    } catch (error) {
      console.error("Idempotency check error:", error);
      // Fail open: if Redis is down, allow send rather than silently skip
      return false;
    }
  }

  async markAsSent(email: string, runDate: string): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.set(this.key(email, runDate), "1", "EX", TTL_SECONDS);
    } catch (error) {
      console.error("Idempotency mark error:", error);
      // Non-fatal: log and continue
    }
  }
}

export const idempotencyService = new IdempotencyService();
