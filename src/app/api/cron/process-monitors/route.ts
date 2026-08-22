import { NextRequest, NextResponse } from "next/server";
import { processBatchMonitors } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    // Basic Cron secret authorization check if configured
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
    const safeLimit = Math.min(Math.max(1, limit), 25);

    const result = await processBatchMonitors(safeLimit);
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Cron processing failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}