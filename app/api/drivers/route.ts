import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { createDriverSchema } from "@/lib/validations/driver";

function nextDriverCode(): string {
  return `DRV-${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const drivers = await prisma.driver.findMany({
    where: { companyId: session.companyId },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(drivers);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  try {
    const body = await request.json();
    const parsed = createDriverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    let code = nextDriverCode();
    while (await prisma.driver.findFirst({ where: { code } })) {
      code = nextDriverCode();
    }
    let licenseExpiryDate: Date | null = null;
    if (parsed.data.licenseExpiry) {
      const d = new Date(parsed.data.licenseExpiry);
      if (!Number.isNaN(d.getTime())) licenseExpiryDate = d;
    }
    const driver = await prisma.driver.create({
      data: {
        companyId: session.companyId,
        code,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        role: parsed.data.role ?? null,
        status: parsed.data.status,
        region: parsed.data.region ?? null,
        avatarUrl: parsed.data.avatarUrl ?? null,
        vehicleId: parsed.data.vehicleId ?? null,
        ...(licenseExpiryDate != null && { licenseExpiry: licenseExpiryDate }),
      },
    });
    await prisma.alert.create({
      data: {
        companyId: session.companyId,
        type:'NEW',
        title: 'Nouveau chauffeur creér',
        description: `Chauffeur ${driver.code} a été enregistrer.`,
        driverId: driver.id,
      },
    });

    return NextResponse.json(driver);
  } catch (e) {
    console.error("Create driver error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
