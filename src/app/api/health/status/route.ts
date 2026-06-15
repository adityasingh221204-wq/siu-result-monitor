import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    // 1. Get the latest portal health entry
    const latestHealth = await db.portalHealth.findFirst({
      orderBy: { checkedAt: "desc" },
    });

    // 2. Get the last 15 health checks for average latency
    const recentHealth = await db.portalHealth.findMany({
      orderBy: { checkedAt: "desc" },
      take: 15,
    });

    const averageLatency =
      recentHealth.length > 0
        ? Math.round(
            recentHealth.reduce((acc: number, h: { responseTime: number }) => acc + h.responseTime, 0) /
              recentHealth.length
          )
        : 0;

    // 3. Get the last 100 monitoring logs to calculate success rate
    const recentLogs = await db.monitoringLog.findMany({
      orderBy: { checkTime: "desc" },
      take: 100,
      select: { status: true },
    });

    const totalRecent = recentLogs.length;
    const successfulRecent = recentLogs.filter(
      (l: { status: string }) => l.status === "SUCCESS" || l.status === "NO_RESULT"
    ).length;

    const successRate = totalRecent > 0 ? (successfulRecent / totalRecent) * 100 : 100;

    // 4. Get active PRN count
    const activeTrackers = await db.tracker.count();

    // 5. Get system settings for check interval
    let settings = await db.systemSettings.findUnique({
      where: { id: "global" },
    });

    if (!settings) {
      settings = await db.systemSettings.create({
        data: { id: "global" },
      });
    }

    // 6. Format data for latency trends chart (Recharts)
    const latencyHistory = recentHealth
      .map((h: any) => ({
        time: new Date(h.checkedAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        latency: h.responseTime,
        status: h.status,
      }))
      .reverse();

    return NextResponse.json({
      success: true,
      status: latestHealth?.status || "ONLINE",
      averageLatency,
      successRate: Math.round(successRate),
      totalTrackers: activeTrackers,
      checkInterval: settings.checkInterval,
      lastCheckedAt: latestHealth?.checkedAt || null,
      latencyHistory,
    });
  } catch (error: any) {
    console.error("Error fetching portal health:", error);
    return NextResponse.json(
      { 
        error: "Internal Server Error", 
        details: error.message,
        debug: {
          DATABASE_URL: process.env.DATABASE_URL,
          PRISMA_DATABASE_URL: process.env.PRISMA_DATABASE_URL,
          NODE_ENV: process.env.NODE_ENV
        }
      },
      { status: 500 }
    );
  }
}
