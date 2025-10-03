import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import { checkRedisHealth } from "../config/redis";

const router = Router();

// GET /health - Health check endpoint
router.get("/", async (req: Request, res: Response) => {
  const health = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    mongodb: "disconnected",
    redis: "disconnected",
    status: "unhealthy",
  };

  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState === 1) {
      health.mongodb = "connected";
    }

    // Check Redis connection
    const redisHealthy = await checkRedisHealth();
    if (redisHealthy) {
      health.redis = "connected";
    }

    // Overall status: healthy if both MongoDB and Redis are connected
    // Redis is optional, so we can be healthy with just MongoDB
    if (health.mongodb === "connected") {
      health.status = "healthy";
    }

    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  } catch {
    health.status = "unhealthy";
    res.status(503).json(health);
  }
});

export default router;
