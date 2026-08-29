import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { queryOne } from "@/lib/mysql";
import { signToken } from "@/lib/jwt";
import { TOKEN_COOKIE_NAME } from "@/lib/auth-middleware";

const LoginSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z.string().min(1, "Password required").max(128),
});

const IS_MYSQL = Boolean(
  process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_PASSWORD && process.env.MYSQL_DATABASE
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    if (!IS_MYSQL) {
      // MySQL not configured � fallback demo mode
      return NextResponse.json({ error: "Database not configured. Please set MYSQL_* environment variables." }, { status: 503 });
    }

    const user = await queryOne<{ id: string; email: string; password: string }>(
      "SELECT id, email, password FROM users WHERE email = ?",
      [email]
    );

    // Always run bcrypt compare even if user not found � prevents timing attacks
    const fakeHash = "$2b$12$fakehashfakehashfakehashfakehashfakehashfakehashfakeha";
    const passwordMatch = await bcrypt.compare(password, user?.password || fakeHash);

    if (!user || !passwordMatch) {
      // Generic message � do not reveal whether email exists
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json(
      { user: { id: user.id, email: user.email }, message: "Signed in successfully" },
      { status: 200 }
    );

    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
