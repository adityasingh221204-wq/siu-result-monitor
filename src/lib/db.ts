import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";

const libsql = createClient({
  url: databaseUrl,
});

const adapter = new PrismaLibSql(libsql as any);

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter } as any);
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const db = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}
