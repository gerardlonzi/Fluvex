import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { buildCsv } from "@/lib/csv";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  IDLE: "Inactif",
  MAINTENANCE: "Maintenance",
};

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();
  if (format !== "csv") {
    return NextResponse.json({ error: "Format non supporté. Utilisez format=csv." }, { status: 400 });
  }

  const drivers = await prisma.driver.findMany({
    where: { companyId: session.companyId },
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["Code", "Nom", "Email", "Téléphone", "Rôle", "Statut", "Région", "Véhicule assigné"];
  const rows = drivers.map((d) => [
    d.code,
    d.name,
    d.email,
    d.phone ?? "",
    d.role ?? "",
    STATUS_LABELS[d.status] ?? d.status,
    d.region ?? "",
    d.vehicle?.name ?? "",
  ]);

  const csv = buildCsv(headers, rows);
  const filename = `chauffeurs_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
