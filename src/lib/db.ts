import path from "path";
import "./env-init";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const rawPrismaDbUrl = process.env["PRISMA_DATABASE_URL"];
if (!rawPrismaDbUrl || rawPrismaDbUrl === "undefined" || rawPrismaDbUrl === "null") {
  process.env["PRISMA_DATABASE_URL"] = "file:./dev.db";
}

const rawDbUrl = process.env["DATABASE_URL"];
let databaseUrl = (!rawDbUrl || rawDbUrl === "undefined" || rawDbUrl === "null")
  ? "file:./dev.db"
  : rawDbUrl;

// Resolve relative SQLite database path to absolute path for the driver adapter
if (databaseUrl.startsWith("file:")) {
  const relativePath = databaseUrl.replace("file:", "");
  const absolutePath = path.resolve(process.cwd(), relativePath);
  databaseUrl = `file:${absolutePath}`;
}

const getPrismaClient = () => {
  console.log("[Prisma] process.env.DATABASE_URL state:", process.env.DATABASE_URL ? "DEFINED" : "UNDEFINED");
  console.log("[Prisma] process.env.PRISMA_DATABASE_URL state:", process.env.PRISMA_DATABASE_URL ? "DEFINED" : "UNDEFINED");
  
  console.log("[Prisma] Initializing with LibSQL Driver Adapter for:", databaseUrl);
  const config = {
    url: databaseUrl,
    authToken: databaseUrl.startsWith("file:") ? undefined : process.env.DATABASE_AUTH_TOKEN,
  };
  const adapter = new PrismaLibSql(config);
  return new PrismaClient({ adapter } as any);
};

declare global {
  var prisma: undefined | ReturnType<typeof getPrismaClient>;
}

export const db = globalThis.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
