import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { buildCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();
  if (format !== "csv") {
    return NextResponse.json({ error: "Format non supporté. Utilisez format=csv." }, { status: 400 });
  }

  const deliveries = await prisma.delivery.findMany({
    where: {
      companyId: session.companyId,
      status: { in: ["PENDING", "LOADING", "TRANSIT", "DELAYED"] },
    },
    include: { driver: true, vehicle: true, routes: true },
    orderBy: { createdAt: "desc" },
  });

  const STATUS_LABELS: Record<string, string> = {
    PENDING: "En attente",
    LOADING: "Chargement",
    TRANSIT: "En transit",
    DELAYED: "Retardé",
  };

  const headers = [
    "ID Suivi",
    "Statut",
    "Chauffeur",
    "Véhicule",
    "Nombre de segments",
    "Créé le",
  ];
  const rows = deliveries.map((d) => [
    d.trackingId,
    STATUS_LABELS[d.status] ?? d.status,
    d.driver?.name ?? "",
    d.vehicle?.name ?? "",
    d.routes?.length ?? 0,
    d.createdAt.toISOString(),
  ]);

  const csv = buildCsv(headers, rows);
  const filename = `routes_actives_${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
