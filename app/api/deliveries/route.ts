import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { createDeliverySchema } from "@/lib/validations/delivery";

function nextTrackingId(): string {
  return `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const driverId = searchParams.get("driverId");
  const vehicleId = searchParams.get("vehicleId");
  const from = searchParams.get("from"); // ISO date
  const to = searchParams.get("to"); // ISO date

  const createdAtFilter: { gte?: Date; lt?: Date } = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) createdAtFilter.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) createdAtFilter.lt = d;
  }

  const deliveries = await prisma.delivery.findMany({
    where: {
      companyId: session.companyId,
      ...(status ? { status: status as "PENDING" | "LOADING" | "TRANSIT" | "DELAYED" | "COMPLETED" | "CANCELLED" } : {}),
      ...(driverId ? { driverId } : {}),
      ...(vehicleId ? { vehicleId } : {}),
      ...(Object.keys(createdAtFilter).length ? { createdAt: createdAtFilter } : {}),
    },
    include: { driver: true, vehicle: true, routes: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(deliveries);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  try {
    const body = await request.json();
    const parsed = createDeliverySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    let trackingId = nextTrackingId();
    while (await prisma.delivery.findFirst({ where: { trackingId } })) {
      trackingId = nextTrackingId();
    }
    const delivery = await prisma.delivery.create({
      data: {
        companyId: session.companyId,
        trackingId,
        status: parsed.data.status,
        amount: parsed.data.amount ?? null,
        currency: parsed.data.currency,
        driverId: parsed.data.driverId ?? null,
        vehicleId: parsed.data.vehicleId ?? null,
      },
    });
    await prisma.alert.create({
      data: {
        companyId: session.companyId,
        type: 'OPTIMIZATION',
        title: 'Nouvelle livraison créée',
        description: `Livraison #${delivery.trackingId} a été créée avec succès.`,
        deliveryId: delivery.id,
      },
    });
    return NextResponse.json(delivery);
  } catch (e) {
    console.error("Create delivery error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
