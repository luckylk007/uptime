import { NextRequest, NextResponse } from "next/server";
import { getMonitorById, getChecks, getIncidents } from "@/lib/db-mysql";
import { getAuthUser } from "@/lib/auth-middleware";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Verify the monitor belongs to this user before returning its history
  const monitor = await getMonitorById(id, authUser.userId);
  if (!monitor) return NextResponse.json({ error: "Monitor not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Math.max(1, Number(searchParams.get("limit") || 50)), 200);

  const [checks, incidents] = await Promise.all([
    getChecks(id, limit),
    getIncidents(id, 20),
  ]);

  return NextResponse.json({ checks, incidents });
}