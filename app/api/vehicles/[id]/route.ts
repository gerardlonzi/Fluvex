import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { updateVehicleSchema } from "@/lib/validations/vehicle";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!vehicle) {
    return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
  }
  return NextResponse.json(vehicle);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const existing = await prisma.vehicle.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
  }
  const body = await request.json();
  const parsed = updateVehicleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      ...(parsed.data.name != null && { name: parsed.data.name }),
      ...(parsed.data.plateNumber !== undefined && { plateNumber: parsed.data.plateNumber }),
      ...(parsed.data.status != null && { status: parsed.data.status }),
    },
  });
  return NextResponse.json(vehicle);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const existing = await prisma.vehicle.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Véhicule introuvable" }, { status: 404 });
  }
  await prisma.vehicle.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
