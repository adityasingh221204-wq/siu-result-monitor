const rawPrismaDbUrl = process.env["PRISMA_DATABASE_URL"];
if (!rawPrismaDbUrl || rawPrismaDbUrl === "undefined" || rawPrismaDbUrl === "null") {
  process.env["PRISMA_DATABASE_URL"] = "file:./dev.db";
}

const rawDbUrl = process.env["DATABASE_URL"];
if (!rawDbUrl || rawDbUrl === "undefined" || rawDbUrl === "null") {
  process.env["DATABASE_URL"] = "file:./dev.db";
}
