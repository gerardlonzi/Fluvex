import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import AnalyticsClient from './AnalyticsClient'

export default async function AnalyticsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - 30)

  const [deliveries, vehicles, alerts] = await Promise.all([
    prisma.delivery.findMany({
      where: { companyId: session.companyId, createdAt: { gte: from } },
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

  return (
    <AnalyticsClient
      initialDeliveries={initialDeliveries}
      initialVehicles={initialVehicles}
      initialAlerts={initialAlerts}
    />
  )
}
