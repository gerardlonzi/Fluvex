import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json().catch(() => ({}));
    const { driverId, deliveryId, lat, lng, heading, speedKmh } = body ?? {};

    if (!driverId || typeof driverId !== "string") {
      return NextResponse.json({ error: "driverId requis" }, { status: 400 });
    }
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "lat/lng requis (number)" }, { status: 400 });
    }

    await prisma.driverLocation.create({
      data: {
        driverId,
        deliveryId: typeof deliveryId === "string" && deliveryId ? deliveryId : null,
        lat,
        lng,
        heading: typeof heading === "number" ? heading : null,
        speedKmh: typeof speedKmh === "number" ? speedKmh : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("telemetry location error", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

