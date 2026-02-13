import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { buildCsv } from "@/lib/csv";

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "csv").toLowerCase();
  if (format !== "csv") return NextResponse.json({ error: "Format non supporte" }, { status: 400 });

  const metrics = await prisma.sustainabilityMetric.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const headers = ["Periode", "CO2 evite (t)", "Objectif CO2 (t)", "Efficacite carburant (%)", "Moy L/100km", "Usage V.E. (%)", "V.E. actifs", "Arbres equiv.", "Economies (EUR)", "Temps gagne (h)", "Eco Score", "Date"];
  const rows = metrics.map((m) => [
    m.period ?? "",
    m.co2AvoidedTonnes != null ? String(m.co2AvoidedTonnes) : "",
    m.co2TargetTonnes != null ? String(m.co2TargetTonnes) : "",
    m.fuelEfficiencyPct != null ? String(m.fuelEfficiencyPct) : "",
    m.fleetAvgLPer100km != null ? String(m.fleetAvgLPer100km) : "",
    m.evUsagePct != null ? String(m.evUsagePct) : "",
    m.evActiveCount != null ? String(m.evActiveCount) : "",
    m.treesEquivalent != null ? String(m.treesEquivalent) : "",
    m.savingsEur != null ? String(m.savingsEur) : "",
    m.timeSavedHours != null ? String(m.timeSavedHours) : "",
    m.ecoScore != null ? String(m.ecoScore) : "",
    m.createdAt.toISOString(),
  ]);

  const csv = buildCsv(headers, rows);
  const filename = "impact_ecologique_" + new Date().toISOString().slice(0, 10) + ".csv";
  return new NextResponse(csv, {
    status: 200,
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=\"" + filename + "\"" },
  });
}
