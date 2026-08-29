import { NextResponse } from "next/server";
import { query } from "@/lib/mysql";

export async function GET() {
  const config = {
    host: process.env.MYSQL_HOST ? `${process.env.MYSQL_HOST.slice(0, 4)}***` : "NOT_SET",
    port: process.env.MYSQL_PORT || "3306",
    user: process.env.MYSQL_USER || "NOT_SET",
    database: process.env.MYSQL_DATABASE || "NOT_SET",
    hasPassword: Boolean(process.env.MYSQL_PASSWORD),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
  };

  try {
    const startTime = Date.now();
    const result = await query<{ test: number }>("SELECT 1 + 1 AS test");
    const pingTimeMs = Date.now() - startTime;

    // Check if tables exist
    const tables = await query<any>("SHOW TABLES");

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Hostinger MySQL Database!",
      pingTimeMs,
      config,
      tables,
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: "Database Connection Failed",
      errorCode: err.code || "UNKNOWN",
      errorMessage: err.message || "Unknown error",
      config,
      troubleshooting: [
        "1. Hostinger hPanel -> Databases -> Remote MySQL: Ensure IP is set to '%' (any IP).",
        "2. Vercel Environment Variables: Ensure MYSQL_HOST is Hostinger's actual MySQL server IP or Hostname (NOT 'localhost').",
        "3. Ensure MYSQL_USER and MYSQL_DATABASE include Hostinger's prefix (e.g. u123456789_...).",
        "4. After updating Vercel environment variables, trigger a Redeploy in Vercel."
      ]
    }, { status: 500 });
  }
}