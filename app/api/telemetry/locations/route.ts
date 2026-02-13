import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const driverId = searchParams.get("driverId") ?? undefined;
  const deliveryId = searchParams.get("deliveryId") ?? undefined;
  const minutesRaw = searchParams.get("minutes");
  const minutes = minutesRaw ? Number(minutesRaw) || 15 : 15;

  const since = new Date(Date.now() - Math.max(1, minutes) * 60 * 1000);

  const rows = await prisma.driverLocation.findMany({
    where: {
      driverId: driverId ?? undefined,
      deliveryId: deliveryId ?? undefined,
      createdAt: { gte: since },
    },
    include: {
      driver: true,
      delivery: true,
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const latestByDriver = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latestByDriver.has(row.driverId)) {
      latestByDriver.set(row.driverId, row);
    }
  }

  const data = Array.from(latestByDriver.values()).map((r) => ({
    driverId: r.driverId,
    driverName: r.driver?.name ?? r.driverId,
    deliveryId: r.deliveryId,
    deliveryTrackingId: r.delivery?.trackingId ?? null,
    lat: r.lat,
    lng: r.lng,
    heading: r.heading,
    speedKmh: r.speedKmh,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json(data);
}

