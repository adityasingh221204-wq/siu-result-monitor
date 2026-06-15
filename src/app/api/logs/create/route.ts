import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prn, status, responseTime, errorMessage, screenshot } = body;

    if (!prn || !status || responseTime === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: prn, status, responseTime" },
        { status: 400 }
      );
    }

    // 1. Find or create the Tracker for this PRN
    let tracker = await db.tracker.findUnique({
      where: { prn },
    });

    if (!tracker) {
      tracker = await db.tracker.create({
        data: {
          prn,
          name: `Tracker ${prn.slice(-4)}`,
        },
      });
    }

    // 2. Create the Monitoring Log
    const log = await db.monitoringLog.create({
      data: {
        trackerId: tracker.id,
        status,
        responseTime,
        errorMessage,
        screenshot,
      },
    });

    // 3. If a result is detected, log a Detection Event
    if (status === "SUCCESS") {
      await db.detectionEvent.create({
        data: {
          trackerId: tracker.id,
          confidence: 1.0,
          status: "NEW",
        },
      });
    }

    // 4. Update Portal Health logs
    let healthStatus = "ONLINE";
    if (status === "FAILED") {
      healthStatus = "DOWN";
    } else if (responseTime > 4000) {
      healthStatus = "SLOW";
    }

    await db.portalHealth.create({
      data: {
        status: healthStatus,
        responseTime,
      },
    });

    return NextResponse.json({
      success: true,
      logId: log.id,
      trackerId: tracker.id,
    });
  } catch (error: any) {
    console.error("Error creating monitoring log:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
