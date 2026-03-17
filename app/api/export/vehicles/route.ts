import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { buildCsv } from "@/lib/csv";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  MAINTENANCE: "Maintenance",
  INACTIVE: "Inactif",
};

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();
  if (format !== "csv") {
    return NextResponse.json({ error: "Format non supporté. Utilisez format=csv." }, { status: 400 });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
  });

  const headers = ["Nom", "Immatriculation", "Statut", "Date de création"];
  const rows = vehicles.map((v) => [
    v.name,
    v.plateNumber ?? "",
    STATUS_LABELS[v.status] ?? v.status,
    v.createdAt ? new Date(v.createdAt).toLocaleDateString("fr-FR") : "",
  ]);

  const csv = buildCsv(headers, rows);
  const filename = `vehicules_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
