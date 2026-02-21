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
  const data = parsed.data;
  const hasAnyUpdate =
    (data.name != null && data.name !== existing.name) ||
    (data.email != null && data.email !== existing.email) ||
    (data.phone !== undefined && (data.phone ?? null) !== existing.phone) ||
    (data.role !== undefined && (data.role ?? null) !== existing.role) ||
    (data.status != null && data.status !== existing.status) ||
    (data.region !== undefined && (data.region ?? null) !== existing.region) ||
    (data.avatarUrl !== undefined && (data.avatarUrl ?? null) !== existing.avatarUrl) ||
    (data.vehicleId !== undefined && (data.vehicleId ?? null) !== existing.vehicleId) ||
    (data.licenseExpiry !== undefined &&
      (() => {
        const newVal = data.licenseExpiry ? new Date(data.licenseExpiry) : null;
        return (newVal?.getTime() ?? null) !== (existing.licenseExpiry?.getTime() ?? null);
      })());
  if (!hasAnyUpdate && Object.keys(data).length > 0) {
    return NextResponse.json(
      { error: "Aucune modification. Modifiez au moins un champ." },
      { status: 400 }
    );
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { error: "Modifiez au moins un champ pour enregistrer." },
      { status: 400 }
    );
  }
  let licenseExpiryDate: Date | null | undefined = undefined;
  if (data.licenseExpiry !== undefined) {
    if (data.licenseExpiry) {
      const d = new Date(data.licenseExpiry);
      licenseExpiryDate = Number.isNaN(d.getTime()) ? null : d;
    } else {
      licenseExpiryDate = null;
    }
  }
  const driver = await prisma.driver.update({
    where: { id },
    data: {
      ...(data.name != null && { name: data.name }),
      ...(data.email != null && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.role !== undefined && { role: data.role }),
      ...(data.status != null && { status: data.status }),
      ...(data.region !== undefined && { region: data.region }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.vehicleId !== undefined && { vehicleId: data.vehicleId }),
      ...(licenseExpiryDate !== undefined && { licenseExpiry: licenseExpiryDate }),
    },
    include: { vehicle: true },
  });

  await prisma.alert.create({
    data: {
      companyId: session.companyId,
      type:'UPDATE',
      title: 'chauffeur mise a jour',
      description: `les information du Chauffeur ${driver.code} a été mis a jour .`,
      driverId: driver.id,
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

  await prisma.alert.create({
    data: {
      companyId: session.companyId,
      type:'DELETE',
      title: "suppression d'un chauffeur",
      description: `Le Chauffeur ${existing.code} et tous les informations le concernant  ont été supprimé.`,
      driverId: existing.id,
    },
  });

  return NextResponse.json({ ok: true });
}
