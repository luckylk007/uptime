import { NextRequest, NextResponse } from "next/server";
import { listMonitors, createMonitor } from "@/lib/db-mysql";
import { getAuthUser } from "@/lib/auth-middleware";
import { z } from "zod";

const CreateMonitorSchema = z.object({
  url: z.string().min(1, "URL is required").max(2048),
  interval_minutes: z.number().int().optional().default(5),
});

export async function GET(req: NextRequest) {
  // Must be authenticated � userId comes from JWT, never from query params
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  try {
    const monitors = await listMonitors(authUser.userId);
    return NextResponse.json({ monitors }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to fetch monitors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Must be authenticated � userId from JWT, not from request body
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized. Please sign in to create a monitor." }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = CreateMonitorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { url, interval_minutes } = parsed.data;

    // userId always taken from verified JWT � client cannot fake another user''s ID
    const result = await createMonitor(url, interval_minutes, authUser.userId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ monitor: result.monitor }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create monitor" }, { status: 500 });
  }
}
