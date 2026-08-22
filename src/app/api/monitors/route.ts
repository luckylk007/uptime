import { NextRequest, NextResponse } from "next/server";
import { listMonitors, createMonitor } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const monitors = await listMonitors(userId);
    return NextResponse.json({ monitors }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch monitors" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { url, interval_minutes = 5, userId = null } = body;
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Field 'url' is required" }, { status: 400 });
    }

    const result = await createMonitor(url, Number(interval_minutes), userId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ monitor: result.monitor }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create monitor" },
      { status: 500 }
    );
  }
}