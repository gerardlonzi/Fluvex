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
    return NextResponse.json({ error: "Format non supporte" }, { status: 400 });
  }

  const [deliveries, vehicles, drivers] = await Promise.all([
    prisma.delivery.findMany({
      where: { companyId: session.companyId },
      include: { driver: true, vehicle: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vehicle.findMany({ where: { companyId: session.companyId } }),
    prisma.driver.findMany({
      where: { companyId: session.companyId },
      include: { vehicle: true },
    }),
  ]);

  const totalDeliveries = deliveries.length;
  const completed = deliveries.filter((d) => d.status === "COMPLETED").length;
  const onTimeRate = totalDeliveries > 0 ? ((completed / totalDeliveries) * 100).toFixed(1) : "0";
  const activeVehicles = vehicles.filter((v) => v.status === "ACTIVE").length;
  const totalRevenue = deliveries
    .filter((d) => d.amount != null)
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const headers = ["Indicateur", "Valeur", "Periode"];
  const rows: (string | number)[][] = [
    ["Total livraisons", totalDeliveries, "Historique"],
    ["Livraisons terminees", completed, "Historique"],
    ["Taux a temps (%)", onTimeRate, "Historique"],
    ["Vehicules actifs", activeVehicles, "Actuel"],
    ["Total vehicules", vehicles.length, "Actuel"],
    ["Chauffeurs", drivers.length, "Actuel"],
    ["Revenu total (CFA)", totalRevenue.toFixed(0), "Historique"],
    ["Date du rapport", new Date().toISOString().slice(0, 10), "-"],
  ];

  const csv = buildCsv(headers, rows);
  const filename = "rapport_analytics_" + new Date().toISOString().slice(0, 10) + ".csv";
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"" + filename + "\"",
    },
  });
}
