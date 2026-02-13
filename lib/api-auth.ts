import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function requireSession(): Promise<
  { userId: string; companyId: string } | NextResponse
> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  return session;
}
