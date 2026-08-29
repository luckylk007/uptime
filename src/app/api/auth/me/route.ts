import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-middleware";
import { queryOne } from "@/lib/mysql";

const IS_MYSQL = Boolean(
  process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_PASSWORD && process.env.MYSQL_DATABASE
);

export async function GET(req: NextRequest) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (IS_MYSQL) {
      const user = await queryOne<{ id: string; email: string; created_at: any }>(
        "SELECT id, email, created_at FROM users WHERE id = ?",
        [authUser.userId]
      );
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      return NextResponse.json({ user: { id: user.id, email: user.email, created_at: user.created_at } });
    }

    // Fallback � return from token
    return NextResponse.json({ user: { id: authUser.userId, email: authUser.email } });
  } catch {
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
