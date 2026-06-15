import "./env-init";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const rawPrismaDbUrl = process.env["PRISMA_DATABASE_URL"];
if (!rawPrismaDbUrl || rawPrismaDbUrl === "undefined" || rawPrismaDbUrl === "null") {
  process.env["PRISMA_DATABASE_URL"] = "file:./dev.db";
}

const rawDbUrl = process.env["DATABASE_URL"];
const databaseUrl = (!rawDbUrl || rawDbUrl === "undefined" || rawDbUrl === "null")
  ? "file:./dev.db"
  : rawDbUrl;

const getPrismaClient = () => {
  console.log("[Prisma] process.env.DATABASE_URL state:", process.env.DATABASE_URL ? "DEFINED" : "UNDEFINED");
  console.log("[Prisma] process.env.PRISMA_DATABASE_URL state:", process.env.PRISMA_DATABASE_URL ? "DEFINED" : "UNDEFINED");
  
  console.log("[Prisma] Initializing with LibSQL Driver Adapter for:", databaseUrl);
  const libsql = createClient({
    url: databaseUrl,
    authToken: databaseUrl.startsWith("file:") ? undefined : process.env.DATABASE_AUTH_TOKEN,
  });
  const adapter = new PrismaLibSql(libsql as any);
  return new PrismaClient({ adapter } as any);
};

declare global {
  var prisma: undefined | ReturnType<typeof getPrismaClient>;
}

export const db = globalThis.prisma ?? getPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
