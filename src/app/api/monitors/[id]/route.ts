import { NextRequest, NextResponse } from "next/server";
import { getMonitorById, updateMonitor, deleteMonitor } from "@/lib/db-mysql";
import { getAuthUser } from "@/lib/auth-middleware";
import { z } from "zod";

const UpdateSchema = z.object({
  enabled: z.boolean().optional(),
  interval_minutes: z.number().int().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const monitor = await getMonitorById(id, authUser.userId);
  if (!monitor) return NextResponse.json({ error: "Monitor not found" }, { status: 404 });

  return NextResponse.json({ monitor });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message }, { status: 400 });
  }

  const result = await updateMonitor(id, authUser.userId, parsed.data);
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.error.includes("not found") ? 404 : 400 }
    );
  }

  return NextResponse.json({ monitor: result.monitor });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const authUser = getAuthUser(req);
  if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const result = await deleteMonitor(id, authUser.userId);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}