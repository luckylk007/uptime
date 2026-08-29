import { NextRequest } from "next/server";
import { verifyToken, type JwtPayload } from "./jwt";

const TOKEN_COOKIE_NAME = "uptimepro_token";

/**
 * Extract authenticated user from request.
 * Checks httpOnly cookie first, then Authorization header (for API clients).
 * Returns null if unauthenticated or token is invalid.
 */
export function getAuthUser(req: NextRequest): JwtPayload | null {
  // 1. Try httpOnly cookie (primary � browser clients)
  const cookieToken = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
  if (cookieToken) {
    const payload = verifyToken(cookieToken);
    if (payload) return payload;
  }

  // 2. Try Authorization header (API/CLI clients)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const headerToken = authHeader.slice(7);
    const payload = verifyToken(headerToken);
    if (payload) return payload;
  }

  return null;
}

export { TOKEN_COOKIE_NAME };
