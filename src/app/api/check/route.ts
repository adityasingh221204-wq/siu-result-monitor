import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const trackers = await db.tracker.findMany({
      orderBy: { createdAt: "desc" },
    });

    const settings = await db.systemSettings.findUnique({
      where: { id: "global" },
    }) || await db.systemSettings.create({ data: { id: "global" } });

    return NextResponse.json({
      success: true,
      trackers,
      settings,
    });
  } catch (error: any) {
    console.error("Error fetching check trackers/settings:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, prn, name, interval, autoRefresh, soundEnabled } = body;

    if (!action) {
      return NextResponse.json({ error: "Missing action field" }, { status: 400 });
    }

    if (action === "add") {
      if (!prn) {
        return NextResponse.json({ error: "PRN is required to add tracker" }, { status: 400 });
      }

      const existing = await db.tracker.findUnique({ where: { prn } });
      if (existing) {
        return NextResponse.json({ error: "PRN is already being monitored" }, { status: 400 });
      }

      const tracker = await db.tracker.create({
        data: {
          prn,
          name: name || `Tracker ${prn.slice(-4)}`,
        },
      });

      return NextResponse.json({ success: true, tracker });
    }

    if (action === "remove") {
      if (!prn) {
        return NextResponse.json({ error: "PRN is required to remove tracker" }, { status: 400 });
      }

      await db.tracker.delete({ where: { prn } });
      return NextResponse.json({ success: true, message: "Tracker removed successfully" });
    }

    if (action === "updateSettings") {
      const settings = await db.systemSettings.upsert({
        where: { id: "global" },
        update: {
          checkInterval: interval !== undefined ? parseInt(interval, 10) : undefined,
          autoRefresh: autoRefresh !== undefined ? autoRefresh : undefined,
          soundEnabled: soundEnabled !== undefined ? soundEnabled : undefined,
        },
        create: {
          id: "global",
          checkInterval: interval !== undefined ? parseInt(interval, 10) : 60,
          autoRefresh: autoRefresh !== undefined ? autoRefresh : true,
          soundEnabled: soundEnabled !== undefined ? soundEnabled : true,
        },
      });

      return NextResponse.json({ success: true, settings });
    }

    if (action === "simulate") {
      // Find the first tracker or create a temporary one for simulation
      let tracker = await db.tracker.findFirst();
      if (!tracker) {
        tracker = await db.tracker.create({
          data: {
            prn: "24070126017",
            name: "Demo Tracker (PRN 6017)",
          },
        });
      }

      // Create a SUCCESS monitoring log with simulated base64 screenshot
      // Just a simple placeholder base64 green dot or transparent image
      const mockScreenshot = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const log = await db.monitoringLog.create({
        data: {
          trackerId: tracker.id,
          status: "SUCCESS",
          responseTime: 420,
          errorMessage: null,
          screenshot: mockScreenshot,
        },
      });

      // Create the detection event
      const detection = await db.detectionEvent.create({
        data: {
          trackerId: tracker.id,
          confidence: 0.99,
          status: "NEW",
        },
      });

      // Log portal health as ONLINE
      await db.portalHealth.create({
        data: {
          status: "ONLINE",
          responseTime: 420,
        },
      });

      return NextResponse.json({
        success: true,
        log,
        detection,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error running action in /api/check:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
