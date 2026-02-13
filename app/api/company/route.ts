import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { updateCompanySchema } from "@/lib/validations/company";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
  });
  if (!company) {
    return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
  }
  return NextResponse.json(company);
}

export async function PATCH(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const existing = await prisma.company.findUnique({
    where: { id: session.companyId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
  }
  const body = await request.json();
  const parsed = updateCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const company = await prisma.company.update({
    where: { id: session.companyId },
    data: {
      ...(parsed.data.name != null && { name: parsed.data.name }),
      ...(parsed.data.email != null && { email: parsed.data.email }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(parsed.data.taxId !== undefined && { taxId: parsed.data.taxId }),
      ...(parsed.data.address !== undefined && { address: parsed.data.address }),
      ...(parsed.data.city !== undefined && { city: parsed.data.city }),
      ...(parsed.data.country != null && { country: parsed.data.country }),
      ...(parsed.data.fleetSize !== undefined && { fleetSize: parsed.data.fleetSize }),
      ...(parsed.data.industry != null && { industry: parsed.data.industry }),
      ...(parsed.data.logoUrl !== undefined && { logoUrl: parsed.data.logoUrl }),
      ...(parsed.data.currency !== undefined && { currency: parsed.data.currency }),
    },
  });
  return NextResponse.json(company);
}
