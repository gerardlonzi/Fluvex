import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/api-auth";
import { AlertType } from "@prisma/client";

export async function POST() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const now = new Date();
  const created: string[] = [];

  try {
    const drivers = await prisma.driver.findMany({
      where: { companyId: session.companyId, licenseExpiry: { lt: now } },
    });
    for (const d of drivers) {
      const exists = await prisma.alert.findFirst({
        where: {
          companyId: session.companyId,
          driverId: d.id,
          type: "OTHER",
          title: { contains: "permis" },
        },
      });
      if (!exists && d.licenseExpiry) {
        await prisma.alert.create({
          data: {
            companyId: session.companyId,
            type: AlertType.OTHER,
            title: "Permis expiré",
            description: `Le permis du chauffeur ${d.name} (${d.code}) a expiré le ${d.licenseExpiry.toLocaleDateString("fr-FR")}.`,
            driverId: d.id,
          },
        });
        created.push(`driver:${d.id}`);
      }
    }

    const deliveries = await prisma.delivery.findMany({
      where: {
        companyId: session.companyId,
        status: { in: ["PENDING", "LOADING", "TRANSIT", "DELAYED"] },
        scheduledAt: { lt: now },
      },
    });
    for (const d of deliveries) {
      const exists = await prisma.alert.findFirst({
        where: {
          companyId: session.companyId,
          deliveryId: d.id,
          type: "OTHER",
          title: { contains: "livraison expirée" },
        },
      });
      if (!exists && d.scheduledAt) {
        await prisma.alert.create({
          data: {
            companyId: session.companyId,
            type: AlertType.OTHER,
            title: "Livraison expirée",
            description: `La livraison #${d.trackingId} était prévue pour le ${d.scheduledAt.toLocaleString("fr-FR")} et n'est pas encore terminée.`,
            deliveryId: d.id,
          },
        });
        created.push(`delivery:${d.id}`);
      }
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const deliveriesDueToday = await prisma.delivery.findMany({
      where: {
        companyId: session.companyId,
        status: { in: ["PENDING", "LOADING", "TRANSIT", "DELAYED"] },
        scheduledAt: { gte: todayStart, lte: todayEnd },
      },
    });
    for (const d of deliveriesDueToday) {
      const exists = await prisma.alert.findFirst({
        where: {
          companyId: session.companyId,
          deliveryId: d.id,
          type: "OTHER",
          title: { contains: "Livraison prévue aujourd'hui" },
        },
      });
      if (!exists && d.scheduledAt) {
        await prisma.alert.create({
          data: {
            companyId: session.companyId,
            type: AlertType.OTHER,
            title: "Livraison prévue aujourd'hui",
            description: `La livraison #${d.trackingId} est prévue aujourd'hui.`,
            deliveryId: d.id,
          },
        });
        created.push(`delivery-today:${d.id}`);
      }
    }

    return NextResponse.json({ ok: true, created: created.length });
  } catch (e) {
    console.error("check-expirations error:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
