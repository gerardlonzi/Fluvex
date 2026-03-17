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

  // Met à jour en base les livraisons expirées avant de retourner les résultats
  const now = new Date();
  await prisma.delivery.updateMany({
    where: {
      companyId: session.companyId,
      status: { in: ["PENDING", "LOADING", "TRANSIT", "DELAYED"] },
      scheduledAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  const deliveries = await prisma.delivery.findMany({
    where: {
      companyId: session.companyId,
      ...(status ? { status: status as "PENDING" | "LOADING" | "TRANSIT" | "DELAYED" | "COMPLETED" | "CANCELLED" | "EXPIRED" } : {}),
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
    let scheduledAt: Date | null = null;
    if (parsed.data.scheduledAt) {
      const d = new Date(parsed.data.scheduledAt);
      if (!Number.isNaN(d.getTime())) scheduledAt = d;
    } else if (parsed.data.scheduledDate && parsed.data.scheduledTime) {
      const d = new Date(`${parsed.data.scheduledDate}T${parsed.data.scheduledTime}`);
      if (!Number.isNaN(d.getTime())) scheduledAt = d;
    }
    const createData = {
      companyId: session.companyId,
      trackingId,
      status: parsed.data.status,
      amount: parsed.data.amount ?? null,
      currency: parsed.data.currency,
      driverId: parsed.data.driverId ?? null,
      vehicleId: parsed.data.vehicleId ?? null,
      packageName: (parsed.data as { packageName?: string }).packageName ?? null,
      weightKg: parsed.data.weightKg ?? null,
      dimensionsL: parsed.data.dimensionsL ?? null,
      dimensionsW: parsed.data.dimensionsW ?? null,
      dimensionsH: parsed.data.dimensionsH ?? null,
      packageType: parsed.data.packageType ?? null,
      recipientCompany: parsed.data.recipientCompany ?? null,
      deliveryAddress: parsed.data.deliveryAddress ?? null,
      contactName: parsed.data.contactName ?? (parsed.data as { recipientName?: string }).recipientName ?? null,
      contactPhone: parsed.data.contactPhone ?? (parsed.data as { recipientPhone?: string }).recipientPhone ?? null,
      scheduledAt,
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const delivery = await prisma.delivery.create({ data: createData as any });
    await prisma.alert.create({
      data: {
        companyId: session.companyId,
        type: 'NEW',
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
