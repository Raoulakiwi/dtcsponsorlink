import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("ADMIN_SESSION_SECRET must be set and at least 16 characters");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionCookie(username: string): string {
  const payload = `${username}:${Date.now() + SESSION_MAX_AGE * 1000}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export async function getSession(): Promise<{ username: string } | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    const [payload, signature] = decoded.split(".");
    if (!payload || !signature) return null;
    const expected = sign(payload);
    if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"))) {
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
