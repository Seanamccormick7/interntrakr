import { createApp } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { connectRedis, disconnectRedis } from "./config/redis";

async function startServer() {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Connect to Redis (non-blocking - app will work without it)
    await connectRedis();

    // Start the Express server
    const app = createApp();
    const server = app.listen(env.PORT, () => {
      console.log(`API running on http://localhost:${env.PORT}`);
    });

    // Graceful shutdown handlers
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      server.close(async () => {
        console.log("HTTP server closed");

        // Close Redis connection
        await disconnectRedis();

        // MongoDB connection is already handled in db.ts
        console.log("All connections closed");
        // eslint-disable-next-line n/no-process-exit
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error("Forcefully shutting down after timeout");
        // eslint-disable-next-line n/no-process-exit
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    // eslint-disable-next-line n/no-process-exit
    process.exit(1);
  }
}

startServer();
