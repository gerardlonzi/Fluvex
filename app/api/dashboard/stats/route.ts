import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";

export async function GET(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get("month"); // YYYY-MM

  const now = new Date();
  let startOfMonth: Date;
  let endOfMonth: Date;
  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    startOfMonth = new Date(y, m - 1, 1);
    endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
  } else {
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date();
  }

  const [
    deliveries,
    vehicles,
    metrics,
    completedInPeriod,
  ] = await Promise.all([
    prisma.delivery.findMany({
      where: { companyId: session.companyId },
      select: { status: true, amount: true, createdAt: true, completedAt: true },
    }),
    prisma.vehicle.findMany({
      where: { companyId: session.companyId },
      select: { status: true },
    }),
    prisma.sustainabilityMetric.findFirst({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" },
      select: { co2AvoidedTonnes: true, period: true },
    }),
    prisma.delivery.count({
      where: {
        companyId: session.companyId,
        status: "COMPLETED",
        completedAt: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
  ]);

  const activeDeliveries = deliveries.filter((d) =>
    ["PENDING", "LOADING", "TRANSIT", "DELAYED"].includes(d.status)
  ).length;
  const fleetTotal = vehicles.length;
  const fleetActive = vehicles.filter((v) => v.status === "ACTIVE").length;
  const co2Kg = metrics?.co2AvoidedTonnes != null ? Math.round(metrics.co2AvoidedTonnes * 1000) : 0;
  const totalRevenue = deliveries
    .filter((d) => d.amount != null)
    .reduce((sum, d) => sum + Number(d.amount), 0);

  return NextResponse.json({
    activeDeliveries,
    completedThisMonth: completedInPeriod,
    fleetTotal,
    fleetActive,
    co2SavedKg: co2Kg,
    totalRevenue,
    period: monthParam || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  });
}
