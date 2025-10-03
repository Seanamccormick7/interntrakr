import Redis from "ioredis";
import { env } from "./env";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        // Exponential backoff: 50ms, 100ms, 200ms, then give up
        if (times > 3) {
          console.error("Redis: Max retries reached, giving up");
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis: Retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
      lazyConnect: true, // Don't connect immediately, wait for explicit connect()
    });

    // Handle connection events
    redisClient.on("connect", () => {
      console.log("Redis: Connected successfully");
    });

    redisClient.on("error", (err) => {
      console.error("Redis: Connection error", err);
    });

    redisClient.on("close", () => {
      console.warn("Redis: Connection closed");
    });

    redisClient.on("reconnecting", () => {
      console.log("Redis: Reconnecting...");
    });
  }

  return redisClient;
}

export async function connectRedis(): Promise<void> {
  try {
    const client = getRedisClient();
    await client.connect();
    console.log("Redis: Connection established");
  } catch (error) {
    console.error("Redis: Failed to connect", error);
    // Don't throw - let the app run without cache
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log("Redis: Disconnected");
  }
}

// Health check for Redis connection
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === "PONG";
  } catch (error) {
    console.error("Redis health check failed:", error);
    return false;
  }
}
