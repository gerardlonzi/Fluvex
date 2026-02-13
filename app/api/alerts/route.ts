import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get("unreadOnly") === "true";
  const alerts = await prisma.alert.findMany({
    where: {
      companyId: session.companyId,
      ...(unreadOnly ? { readAt: null } : {}),
    },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(alerts);
}
