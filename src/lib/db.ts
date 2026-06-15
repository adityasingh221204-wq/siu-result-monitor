import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

if (!process.env.PRISMA_DATABASE_URL) {
  process.env.PRISMA_DATABASE_URL = "file:./dev.db";
}

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

const getPrismaClient = () => {
  console.log("[Prisma] process.env.DATABASE_URL state:", process.env.DATABASE_URL ? "DEFINED" : "UNDEFINED");
  console.log("[Prisma] process.env.PRISMA_DATABASE_URL state:", process.env.PRISMA_DATABASE_URL ? "DEFINED" : "UNDEFINED");
  if (databaseUrl.startsWith("libsql://") || databaseUrl.startsWith("wss://")) {
    console.log("[Prisma] Initializing with LibSQL Driver Adapter");
    const libsql = createClient({
      url: databaseUrl,
      authToken: process.env.DATABASE_AUTH_TOKEN,
    });
    const adapter = new PrismaLibSql(libsql as any);
    return new PrismaClient({ adapter } as any);
  } else {
    console.log("[Prisma] Initializing with Native SQLite Driver");
    return new PrismaClient();
  }
};

declare global {
  var prisma: undefined | ReturnType<typeof getPrismaClient>;
}

export const db = globalThis.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
