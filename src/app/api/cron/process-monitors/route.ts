import { NextRequest, NextResponse } from "next/server";
import { processBatchMonitors } from "@/lib/db-mysql";

export async function POST(req: NextRequest) {
  try {
    // CRON_SECRET authorization � must match env var
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(1, Number(searchParams.get("limit") || "10")), 25);

    const result = await processBatchMonitors(limit);
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Cron processing failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
