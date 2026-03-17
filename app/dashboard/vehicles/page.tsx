import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import VehiclesClient from './VehiclesClient'

function parseYmd(s: string | undefined): Date | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')

  const company = await prisma.company.findUnique({
    where: { id: session.companyId },
    select: { createdAt: true },
  })
  const companyCreatedAt = company?.createdAt ?? new Date()
  const companyCreatedAtYmd = `${companyCreatedAt.getFullYear()}-${String(companyCreatedAt.getMonth() + 1).padStart(2, '0')}-${String(companyCreatedAt.getDate()).padStart(2, '0')}`

  const { from, to } = await searchParams
  const fromDate = parseYmd(from)
  const toDate = parseYmd(to)
  if (toDate) toDate.setHours(23, 59, 59, 999)

  const vehicles = await prisma.vehicle.findMany({
    where: {
      companyId: session.companyId,
      ...(fromDate || toDate
        ? { createdAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <VehiclesClient
      initialVehicles={vehicles}
      initialFrom={from ?? null}
      initialTo={to ?? null}
      companyCreatedAt={companyCreatedAtYmd}
    />
  )
}
