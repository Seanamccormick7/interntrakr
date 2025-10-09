import { env } from "./env";
import {
  connectDB as connectMongo,
  disconnectDB as disconnectMongo,
} from "./db";
import { connectPrisma, disconnectPrisma } from "./prisma";

export async function connectDatabase(): Promise<void> {
  console.log(`Connecting to database with engine: ${env.DB_ENGINE}`);

  if (env.DB_ENGINE === "postgres") {
    await connectPrisma();
  } else {
    await connectMongo();
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (env.DB_ENGINE === "postgres") {
    await disconnectPrisma();
  } else {
    await disconnectMongo();
  }
}
