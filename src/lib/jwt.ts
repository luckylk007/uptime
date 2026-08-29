import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || (process.env.NODE_ENV === "test" ? "test-secret-key-32-chars-long-minimum-test" : "uptimepro-default-jwt-secret-fallback-key-2026");
}

export interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Sign a JWT token for a user.
 */
export function signToken(payload: JwtPayload): string {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  return jwt.sign(payload, secret, { expiresIn } as any);
}

/**
 * Verify and decode a JWT token.
 * Returns null if token is invalid/expired.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
