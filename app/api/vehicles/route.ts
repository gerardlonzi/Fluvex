import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { createVehicleSchema } from "@/lib/validations/vehicle";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const vehicles = await prisma.vehicle.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(vehicles);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  try {
    const body = await request.json();
    const parsed = createVehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const vehicle = await prisma.vehicle.create({
      data: {
        companyId: session.companyId,
        name: parsed.data.name,
        plateNumber: parsed.data.plateNumber ?? null,
        status: parsed.data.status,
      },
    });
    return NextResponse.json(vehicle);
  } catch (e) {
    console.error("Create vehicle error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
