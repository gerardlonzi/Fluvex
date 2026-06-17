import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import {
  SESSION_COOKIE,
  createSession,
  parseSession,
  sessionCookieOptions,
  applySessionCookie,
  clearSessionCookie,
} from "@/lib/session";

export {
  SESSION_COOKIE,
  createSession,
  parseSession,
  applySessionCookie,
  clearSessionCookie,
};

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

export async function getSession(): Promise<{ userId: string; companyId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return parseSession(token);
}

export async function requireAuth(): Promise<{ userId: string; companyId: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function setSessionCookie(session: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, session, sessionCookieOptions());
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
