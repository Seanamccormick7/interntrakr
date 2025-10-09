import { PrismaClient } from "@prisma/client";
import { env } from "./env";

let prisma: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (prisma) return prisma;

  prisma = new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  return prisma;
}

export async function connectPrisma(): Promise<void> {
  if (env.DB_ENGINE !== "postgres") return;

  try {
    const client = getPrismaClient();
    await client.$connect();
    console.log("PostgreSQL: Connected via Prisma");

    // Graceful shutdown
    const cleanup = async () => {
      await client.$disconnect();
      console.log("PostgreSQL: Connection closed due to app termination");
    };

    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } catch (error) {
    console.error("PostgreSQL: Failed to connect", error);
    throw error;
  }
}

export async function disconnectPrisma(): Promise<void> {
  if (!prisma) return;
  await prisma.$disconnect();
  console.log("PostgreSQL: Disconnected");
}
