import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

export async function POST() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const now = new Date();

  const candidates = await prisma.delivery.findMany({
    where: {
      companyId: session.companyId,
      status: { in: ["PENDING", "LOADING", "TRANSIT", "DELAYED"] },
      scheduledAt: { lt: now },
    },
    select: { id: true },
  });

  if (candidates.length === 0) {
    return NextResponse.json({ updated: 0 });
  }

  const ids = candidates.map((d) => d.id);

  const result = await prisma.delivery.updateMany({
    where: { id: { in: ids } },
    data: { status: "EXPIRED" },
  });

  return NextResponse.json({ updated: result.count });
}

