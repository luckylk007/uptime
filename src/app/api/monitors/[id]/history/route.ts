import { NextRequest, NextResponse } from "next/server";
import { getChecks, getIncidents } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const limit = Number.parseInt(url.searchParams.get("limit") || "50", 10);

    const [checks, incidents] = await Promise.all([
      getChecks(id, limit),
      getIncidents(id, 20),
    ]);

    return NextResponse.json({ checks, incidents }, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch monitor history" },
      { status: 500 }
    );
  }
}