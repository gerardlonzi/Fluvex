import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AnalyticsClient from './AnalyticsClient'

function parseYmd(s: string | undefined): Date | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await requireAuth()

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    select: { createdAt: true },
  })
  const companyCreatedAt = company?.createdAt ?? new Date()

  function toYmd(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const { from: fromStr, to: toStr } = await searchParams
  let fromDate = parseYmd(fromStr)
  let toDate = parseYmd(toStr)
  if (!fromDate && !toDate) {
    fromDate = new Date(companyCreatedAt)
    toDate = new Date()
  }
  if (toDate) toDate.setHours(23, 59, 59, 999)

  const createdAtFilter = {
    ...(fromDate ? { gte: fromDate } : {}),
    ...(toDate ? { lte: toDate } : {}),
  }

  const [deliveries, vehicles, alerts] = await Promise.all([
    prisma.delivery.findMany({
      where: {
        companyId: session.companyId,
        createdAt: createdAtFilter,
      },
      select: { id: true, trackingId: true, status: true, amount: true, currency: true, createdAt: true, completedAt: true },
    }),
    prisma.vehicle.findMany({
      where: { companyId: session.companyId },
      select: { id: true, status: true },
    }),
    prisma.alert.findMany({
      where: { companyId: session.companyId },
      select: { id: true, type: true, title: true, description: true, createdAt: true, readAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  const initialDeliveries = deliveries.map((d) => ({
    id: d.id,
    trackingId: d.trackingId,
    status: d.status,
    amount: d.amount,
    currency: d.currency,
    createdAt: d.createdAt.toISOString(),
    completedAt: d.completedAt?.toISOString() ?? null,
  }))
  const initialVehicles = vehicles.map((v) => ({ id: v.id, status: v.status }))
  const initialAlerts = alerts.map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    description: a.description,
    createdAt: a.createdAt.toISOString(),
    readAt: a.readAt?.toISOString() ?? null,
  }))

  const chartFrom = fromDate ? toYmd(fromDate) : toYmd(companyCreatedAt)
  const chartTo = toDate ? toYmd(toDate) : toYmd(new Date())
  const displayFrom = fromStr ?? chartFrom
  const displayTo = toStr ?? chartTo

  return (
    <AnalyticsClient
      initialDeliveries={initialDeliveries}
      initialVehicles={initialVehicles}
      initialAlerts={initialAlerts}
      initialFrom={displayFrom}
      initialTo={displayTo}
      chartFrom={chartFrom}
      chartTo={chartTo}
      companyCreatedAt={toYmd(companyCreatedAt)}
    />
  )
}
