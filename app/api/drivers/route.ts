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
      },
    });
    return NextResponse.json(driver);
  } catch (e) {
    console.error("Create driver error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
