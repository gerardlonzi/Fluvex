import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { updateDeliverySchema } from "@/lib/validations/delivery";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const delivery = await prisma.delivery.findFirst({
    where: { id, companyId: session.companyId },
    include: { driver: true, vehicle: true, routes: true },
  });
  if (!delivery) {
    return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 });
  }
  return NextResponse.json(delivery);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const existing = await prisma.delivery.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 });
  }
  const body = await request.json();
  const parsed = updateDeliverySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const delivery = await prisma.delivery.update({
    where: { id },
    data: {
      ...(parsed.data.status != null && { status: parsed.data.status }),
      ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
      ...(parsed.data.currency != null && { currency: parsed.data.currency }),
      ...(parsed.data.driverId !== undefined && { driverId: parsed.data.driverId }),
      ...(parsed.data.vehicleId !== undefined && { vehicleId: parsed.data.vehicleId }),
      ...(parsed.data.startedAt !== undefined && { startedAt: parsed.data.startedAt ? new Date(parsed.data.startedAt) : null }),
      ...(parsed.data.completedAt !== undefined && { completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : null }),
    },
  });
  return NextResponse.json(delivery);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const existing = await prisma.delivery.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 });
  }
  await prisma.delivery.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
