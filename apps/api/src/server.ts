import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { connectDB } from "./config/db";
import { connectRedis, disconnectRedis } from "./config/redis";
import { initializeSocketIO } from "./config/socket";

async function startServer() {
  try {
    await connectDB();
    await connectRedis();

    const app = createApp();
    const server = createServer(app);

    initializeSocketIO(server);

    server.listen(env.PORT, () => {
      console.log(`API running on http://localhost:${env.PORT}`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);

      server.close(async () => {
        console.log("HTTP server closed");
        await disconnectRedis();
        console.log("All connections closed");
        // eslint-disable-next-line n/no-process-exit
        process.exit(0);
      });

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
