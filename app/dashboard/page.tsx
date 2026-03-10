import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardClient from './DashboardClient'
import type { RecentDelivery, DashboardStats } from '@/utils/types'

function parseYmd(s: string | undefined): Date | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { from, to } = await searchParams
  const fromDate = parseYmd(from)
  const toDate = parseYmd(to)
  if (toDate) toDate.setHours(23, 59, 59, 999)

  // Requête pour les livraisons récentes (limitées à 5, filtrées si période)
  const recentDeliveriesRaw = await prisma.delivery.findMany({
    where: {
      companyId: session.companyId,
      ...(fromDate || toDate
        ? { createdAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
        : {}),
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      trackingId: true,
      status: true,
      amount: true,
      currency: true,
      createdAt: true,          // ← on récupère la Date brute
      driver: { select: { name: true, avatarUrl: true } },
    },
  })

  // Mapping pour forcer createdAt en string ISO (fixe le problème du graphe)
  const initialRecent: RecentDelivery[] = recentDeliveriesRaw.map((d) => ({
    id: d.id,
    trackingId: d.trackingId,
    status: d.status,
    amount: d.amount,
    currency: d.currency,
    createdAt: d.createdAt.toISOString(),  // ← CONVERSION ICI ! (string ISO)
    driver: d.driver ? { name: d.driver.name, ...(d.driver.avatarUrl && { avatarUrl: d.driver.avatarUrl }) } : undefined,
  }))

  // Toutes les livraisons pour calcul stats (pas de take)
  const allDeliveries = await prisma.delivery.findMany({
    where: {
      companyId: session.companyId,
      ...(fromDate || toDate
        ? { createdAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
        : {}),
    },
    select: { status: true, amount: true, completedAt: true },
  })

  // Flotte (inchangé)
  const vehicles = await prisma.vehicle.findMany({
    where: { companyId: session.companyId },
    select: { status: true },
  })

  // Metrics CO2 (inchangé)
  const metrics = await prisma.sustainabilityMetric.findFirst({
    where: { companyId: session.companyId },
    orderBy: { createdAt: 'desc' },
    select: { co2AvoidedTonnes: true },
  })

  // Nombre de complétées dans la période (adapté au filtre)
  const completedInPeriod = await prisma.delivery.count({
    where: {
      companyId: session.companyId,
      status: 'COMPLETED',
      ...(fromDate || toDate
        ? { completedAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
        : {}),
    },
  })

  // Calculs stats (même logique, avec allDeliveries filtré)
  const activeDeliveries = allDeliveries.filter((d) =>
    ['PENDING', 'LOADING', 'TRANSIT', 'DELAYED'].includes(d.status)
  ).length

  const fleetTotal = vehicles.length
  const fleetActive = vehicles.filter((v) => v.status === 'ACTIVE').length
  const co2Kg = metrics?.co2AvoidedTonnes != null ? Math.round(metrics.co2AvoidedTonnes * 1000) : 0
  const totalRevenue = allDeliveries
    .filter((d) => d.amount != null)
    .reduce((sum, d) => sum + Number(d.amount), 0)

  const stats: DashboardStats = {
    activeDeliveries,
    completedThisMonth: completedInPeriod,
    fleetTotal,
    fleetActive,
    co2SavedKg: co2Kg,
    totalRevenue,
    period: from && to ? `${from} → ${to}` : 'Période actuelle',
    from: from ?? null,
    to: to ?? null,
  }

  return (
    <DashboardClient
      initialRecentDeliveries={initialRecent}
      initialStats={stats}
      initialFrom={from ?? null}
      initialTo={to ?? null}
    />
  )
}