import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DriversClient from './DriversClient'

export default async function DriversPage({
  searchParams,
}: {
  searchParams: Promise<{ driver?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - 60)

  const [drivers, deliveries] = await Promise.all([
    prisma.driver.findMany({
      where: { companyId: session.companyId },
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.delivery.findMany({
      where: {
        companyId: session.companyId,
        createdAt: { gte: from },
      },
      select: {
        id: true,
        trackingId: true,
        status: true,
        createdAt: true,
        amount: true,
        currency: true,
        driverId: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const { driver: driverParam } = await searchParams

  return (
    <DriversClient
      initialDrivers={drivers}
      initialDeliveries={deliveries}
      initialDriverIdFromUrl={driverParam ?? undefined}
    />
  )
}
