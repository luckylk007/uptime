import { NextRequest, NextResponse } from "next/server";
import { updateMonitor, deleteMonitor, listMonitors } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const monitors = await listMonitors();
  const monitor = monitors.find((m) => m.id === id);

  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  return NextResponse.json({ monitor }, { status: 200 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const updates: { enabled?: boolean; interval_minutes?: number } = {};
    if (typeof body.enabled === "boolean") {
      updates.enabled = body.enabled;
    }
    if (body.interval_minutes !== undefined) {
      updates.interval_minutes = Number(body.interval_minutes);
    }

    const result = await updateMonitor(id, updates);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ monitor: result.monitor }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update monitor" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteMonitor(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Monitor not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to delete monitor" }, { status: 500 });
  }
}