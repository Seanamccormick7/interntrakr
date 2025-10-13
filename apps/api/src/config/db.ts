import mongoose from "mongoose";
import { env } from "./env";

// Track connection state
let isConnected = false;

export async function connectDB(): Promise<void> {
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

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("MongoDB: Connection closed due to app termination");
      throw new Error("Failed to connect to MongoDB");
    });
  } catch (error) {
    console.error("MongoDB: Failed to connect", error);
    isConnected = false;
    throw error;
  }
}

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB: Connected successfully");
  } catch (error) {
    console.error("MongoDB: Connection failed", error);
    // Don't throw or exit - let the app handle it
    // In production, you might want to retry or use a health check
  }
}
