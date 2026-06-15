import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const prn = searchParams.get("prn");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Filter by PRN if provided
    const trackerFilter = prn ? { tracker: { prn } } : {};

    // Get the latest monitoring logs
    const logs = await db.monitoringLog.findMany({
      where: trackerFilter,
      orderBy: {
        checkTime: "desc",
      },
      take: limit,
      include: {
        tracker: {
          select: {
            prn: true,
            name: true,
          },
        },
      },
    });

    // Get all detection events
    const detections = await db.detectionEvent.findMany({
      where: prn ? { tracker: { prn } } : {},
      orderBy: {
        detectedAt: "desc",
      },
      include: {
        tracker: {
          select: {
            prn: true,
          },
        },
      },
    });

    // Fetch total count of logs
    const totalChecks = await db.monitoringLog.count({
      where: trackerFilter,
    });

    return NextResponse.json({
      success: true,
      logs,
      detections,
      totalChecks,
    });
  } catch (error: any) {
    console.error("Error fetching logs history:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
