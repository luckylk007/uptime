import { NextResponse } from "next/server";
import { TOKEN_COOKIE_NAME } from "@/lib/auth-middleware";

export async function POST() {
  const response = NextResponse.json({ message: "Signed out successfully" }, { status: 200 });
  // Clear the httpOnly auth cookie
  response.cookies.set(TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });
  return response;
}
