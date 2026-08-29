import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query, queryOne } from "@/lib/mysql";
import { signToken } from "@/lib/jwt";
import { TOKEN_COOKIE_NAME } from "@/lib/auth-middleware";
import crypto from "node:crypto";

const SignupSchema = z.object({
  email: z.string().email("Invalid email address").max(255),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
});

const IS_MYSQL = Boolean(
  process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_PASSWORD && process.env.MYSQL_DATABASE
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Hash password with bcrypt (cost factor 12 � slow enough to resist brute force)
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    if (IS_MYSQL) {
      // Check if email already taken
      const existing = await queryOne<any>("SELECT id FROM users WHERE email = ?", [email]);
      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
      }

      await query(
        "INSERT INTO users (id, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [userId, email, hashedPassword, now, now]
      );
    }

    const token = signToken({ userId, email });

    // Return JWT in httpOnly cookie (not readable by JavaScript � XSS resistant)
    const response = NextResponse.json(
      { user: { id: userId, email }, message: "Account created successfully" },
      { status: 201 }
    );

    response.cookies.set(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Signup error:", err);
    if (err?.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }
    if (err?.code === "ETIMEDOUT" || err?.code === "ECONNREFUSED" || err?.code === "ER_ACCESS_DENIED_ERROR") {
      return NextResponse.json(
        { error: `Database Error (${err.code}): Please verify Hostinger Remote MySQL is enabled and credentials are correct.` },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: err?.message || "Failed to create account" }, { status: 500 });
  }
}
