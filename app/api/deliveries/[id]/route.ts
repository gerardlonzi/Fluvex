import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { updateDeliverySchema } from "@/lib/validations/delivery";
import { AlertType } from "@prisma/client";

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
      ...(parsed.data.recipientCompany !== undefined && { recipientCompany: parsed.data.recipientCompany }),
      ...(parsed.data.deliveryAddress !== undefined && { deliveryAddress: parsed.data.deliveryAddress }),
      ...(parsed.data.contactName !== undefined && { contactName: parsed.data.contactName }),
      ...(parsed.data.contactPhone !== undefined && { contactPhone: parsed.data.contactPhone }),
      ...(parsed.data.scheduledAt !== undefined && { scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null }),
      ...(parsed.data.startedAt !== undefined && { startedAt: parsed.data.startedAt ? new Date(parsed.data.startedAt) : null }),
      ...(parsed.data.completedAt !== undefined && { completedAt: parsed.data.completedAt ? new Date(parsed.data.completedAt) : null }),
    },
    include: { driver: true, vehicle: true, routes: true },
  });
  await prisma.alert.create({
    data: {
      companyId: session.companyId,
      type:'UPDATE',
      title: 'Livraison mise a jour',
      description: `Livraison #${delivery.trackingId} a été modifier avec success.`,
      deliveryId: delivery.id,
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

  await prisma.alert.create({
    data: {
      companyId: session.companyId,
      type:'DELETE',
      title: 'Livraison supprimeé ',
      description: `Livraison #${existing.trackingId} et tous ces details  ont été supprimeé.`,
      deliveryId: existing.id,
    },
  });
  return NextResponse.json({ ok: true });
}
