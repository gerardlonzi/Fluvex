import type { NextResponse } from "next/server";

export const SESSION_COOKIE = "fluvex_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production" && !secret) {
    console.error(
      "[auth] SESSION_SECRET est absent en production. Définissez-le dans les variables d'environnement du déploiement.",
    );
  }
  return secret || "fluvex-dev-secret-change-in-production";
}

async function signPayload(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSession(userId: string, companyId: string): Promise<string> {
  const payload = `${userId}:${companyId}:${Date.now()}`;
  const signature = await signPayload(payload);
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

export async function parseSession(
  token: string,
): Promise<{ userId: string; companyId: string } | null> {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [payload, signature] = decoded.split(".");
    if (!payload || !signature) return null;
    const expected = await signPayload(payload);
    if (expected !== signature) return null;
    const [userId, companyId, ts] = payload.split(":");
    if (!userId || !companyId || !ts) return null;
    const age = Date.now() - Number(ts);
    if (age > SESSION_MAX_AGE * 1000) return null;
    return { userId, companyId };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

export function applySessionCookie(response: NextResponse, session: string) {
  response.cookies.set(SESSION_COOKIE, session, sessionCookieOptions());
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
}
