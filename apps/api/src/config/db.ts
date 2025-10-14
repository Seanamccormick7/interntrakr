import mongoose from "mongoose";
import { env } from "./env";

// Track connection state
let isConnected = false;

export async function connectDB(): Promise<void> {
  // Skip if using PostgreSQL
  if (env.DB_ENGINE !== "mongo") {
    console.log("MongoDB: Skipped (using PostgreSQL)");
    return;
  }

  if (isConnected) {
    console.log("MongoDB: Already connected");
    return;
  }

  try {
    // Connection options for production readiness
    await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 10, // Connection pool size
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Socket timeout
    });

    isConnected = true;
    console.log(`MongoDB: Connected to ${mongoose.connection.name}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      isConnected = false;
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB: Disconnected");
      isConnected = false;
    });

    // Graceful shutdown handler
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB: Connection closed due to app termination");
      // eslint-disable-next-line n/no-process-exit
      process.exit(0);
    });
  } catch (error) {
    console.error("MongoDB: Failed to connect", error);
    isConnected = false;
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  // Skip if using PostgreSQL or not connected
  if (env.DB_ENGINE !== "mongo" || !isConnected) {
    return;
  }

  await mongoose.connection.close();
  isConnected = false;
  console.log("MongoDB: Disconnected");
}
