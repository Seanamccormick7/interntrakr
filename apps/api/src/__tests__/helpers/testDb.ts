// Test database helper - handles both MongoDB and PostgreSQL
import mongoose from "mongoose";
import { env } from "../../config/env";
import {
  connectPrisma,
  disconnectPrisma,
  getPrismaClient,
} from "../../config/prisma";

export async function setupTestDatabase() {
  if (env.DB_ENGINE === "postgres") {
    // PostgreSQL setup
    await connectPrisma();
    const prisma = getPrismaClient();

    // Clean all tables
    await prisma.application.deleteMany({});
    await prisma.user.deleteMany({});
  } else {
    // MongoDB setup
    const mongoUri =
      process.env.MONGO_URI || "mongodb://localhost:27017/interntrackr_test";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

export async function teardownTestDatabase() {
  if (env.DB_ENGINE === "postgres") {
    await disconnectPrisma();
  } else {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
}

export async function clearTestDatabase() {
  if (env.DB_ENGINE === "postgres") {
    const prisma = getPrismaClient();
    await prisma.application.deleteMany({});
    await prisma.user.deleteMany({});
  } else {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}
