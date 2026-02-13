import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const metrics = await prisma.sustainabilityMetric.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "desc" },
    take: 24,
  });
  return NextResponse.json(metrics);
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  try {
    const body = await request.json();
    if (!body.period || typeof body.period !== "string") {
      return NextResponse.json({ error: "period requis" }, { status: 400 });
    }
    const data: Record<string, unknown> = {
      companyId: session.companyId,
      period: body.period,
      co2AvoidedTonnes: body.co2AvoidedTonnes ?? null,
      co2TargetTonnes: body.co2TargetTonnes ?? null,
      fuelEfficiencyPct: body.fuelEfficiencyPct ?? null,
      fleetAvgLPer100km: body.fleetAvgLPer100km ?? null,
      evUsagePct: body.evUsagePct ?? null,
      evActiveCount: body.evActiveCount ?? null,
      treesEquivalent: body.treesEquivalent ?? null,
      savingsEur: body.savingsEur ?? null,
      timeSavedHours: body.timeSavedHours ?? null,
      ecoScore: body.ecoScore ?? null,
    };
    const metric = await prisma.sustainabilityMetric.create({
      data: data as Parameters<typeof prisma.sustainabilityMetric.create>[0]["data"],
    });
    return NextResponse.json(metric);
  } catch (e) {
    console.error("Create sustainability metric error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
