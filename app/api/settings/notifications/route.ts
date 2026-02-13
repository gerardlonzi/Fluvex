import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { notificationPrefsSchema } from "@/lib/validations/company";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const prefs = await prisma.notificationPreference.findFirst({
    where: { companyId: session.companyId },
  });
  if (!prefs) {
    return NextResponse.json({
      shipments: true,
      fleet: true,
      billing: false,
    });
  }
  return NextResponse.json({
    shipments: prefs.shipments,
    fleet: prefs.fleet,
    billing: prefs.billing,
  });
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const body = await request.json();
  const parsed = notificationPrefsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const prefs = await prisma.notificationPreference.upsert({
    where: { companyId: session.companyId },
    create: {
      companyId: session.companyId,
      shipments: parsed.data.shipments,
      fleet: parsed.data.fleet,
      billing: parsed.data.billing,
    },
    update: {
      shipments: parsed.data.shipments,
      fleet: parsed.data.fleet,
      billing: parsed.data.billing,
    },
  });
  return NextResponse.json(prefs);
}
