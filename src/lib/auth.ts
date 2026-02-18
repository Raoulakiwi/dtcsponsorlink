import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Returns the secret or null if not set (avoids throwing in getSession). */
function getSecret(): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) return null;
  return secret;
}

function sign(payload: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Returns cookie value or null if ADMIN_SESSION_SECRET is not configured. */
export function createSessionCookie(username: string): string | null {
  const payload = `${username}:${Date.now() + SESSION_MAX_AGE * 1000}`;
  const sig = sign(payload);
  if (!sig) return null;
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export async function getSession(): Promise<{ username: string } | null> {
  if (!getSecret()) return null;
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const [payload, signature] = decoded.split(".");
    if (!payload || !signature) return null;
    const expected = sign(payload);
    if (!expected || signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"))) {
      return null;
    }
    const [username, expStr] = payload.split(":");
    const exp = Number(expStr);
    if (!username || Number.isNaN(exp) || Date.now() > exp) return null;
    return { username };
  } catch {
    return null;
  }
}

export async function setSessionCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/admin",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/admin",
  });
}
