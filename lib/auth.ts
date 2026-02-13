import { cookies } from "next/headers";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "fluvex_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "fluvex-dev-secret-change-in-production";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(stored: string, password: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
}

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

export function createSession(userId: string, companyId: string): string {
  const payload = `${userId}:${companyId}:${Date.now()}`;
  const signature = sign(payload);
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export function parseSession(token: string): { userId: string; companyId: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [payload, signature] = decoded.split(".");
    if (!payload || !signature || sign(payload) !== signature) return null;
    const [userId, companyId, ts] = payload.split(":");
    if (!userId || !companyId || !ts) return null;
    const age = Date.now() - Number(ts);
    if (age > SESSION_MAX_AGE * 1000) return null;
    return { userId, companyId };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{ userId: string; companyId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSession(token);
}

export async function setSessionCookie(session: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
