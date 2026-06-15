import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL || "not set",
    DATABASE_URL: process.env.DATABASE_URL || "not set",
    NODE_ENV: process.env.NODE_ENV || "not set",
    TIME: new Date().toISOString()
  });
}
