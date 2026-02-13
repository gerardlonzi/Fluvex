import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { updateDriverSchema } from "@/lib/validations/driver";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const driver = await prisma.driver.findFirst({
    where: { id, companyId: session.companyId },
    include: { vehicle: true, performance: true, certifications: true },
  });
  if (!driver) {
    return NextResponse.json({ error: "Chauffeur introuvable" }, { status: 404 });
  }
  return NextResponse.json(driver);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const existing = await prisma.driver.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Chauffeur introuvable" }, { status: 404 });
  }
  const body = await request.json();
  const parsed = updateDriverSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const driver = await prisma.driver.update({
    where: { id },
    data: {
      ...(parsed.data.name != null && { name: parsed.data.name }),
      ...(parsed.data.email != null && { email: parsed.data.email }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(parsed.data.role !== undefined && { role: parsed.data.role }),
      ...(parsed.data.status != null && { status: parsed.data.status }),
      ...(parsed.data.region !== undefined && { region: parsed.data.region }),
      ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
      ...(parsed.data.vehicleId !== undefined && { vehicleId: parsed.data.vehicleId }),
    },
  });
  return NextResponse.json(driver);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  const existing = await prisma.driver.findFirst({
    where: { id, companyId: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Chauffeur introuvable" }, { status: 404 });
  }
  await prisma.driver.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
