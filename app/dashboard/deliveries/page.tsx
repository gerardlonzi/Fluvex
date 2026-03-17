import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { expireDeliveriesForCompany } from '@/lib/expireDeliveries'
import DeliveriesClient from './DeliveriesClient'
import type { DeliveryRow, DriverOption, VehicleOption } from '@/utils/types'

function parseYmd(s: string | undefined): Date | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? null : d
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  LOADING: 'Chargement',
  TRANSIT: 'En transit',
  DELAYED: 'Retardé',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  EXPIRED: 'Livraison expirée',
}

function mapToRow(d: {
  id: string
  trackingId: string
  status: string
  amount: number | null
  currency: string
  driver: { name: string } | null
  driverId: string | null
  vehicleId: string | null
  deliveryAddress: string | null
  recipientCompany: string | null
  contactName: string | null
  contactPhone: string | null
  scheduledAt: Date | null
  createdAt: Date
  startedAt: Date | null
  completedAt: Date | null
}): DeliveryRow {
  return {
    id: d.id,
    trackingId: d.trackingId,
    client: d.recipientCompany ?? '—',
    status: d.status,
    statusLabel: STATUS_LABELS[d.status] ?? d.status,
    driver: d.driver?.name ?? 'Non assigné',
    driverId: d.driverId ?? null,
    vehicleId: d.vehicleId ?? null,
    dest: d.deliveryAddress ?? '—',
    amount: d.amount != null ? String(d.amount) : '—',
    currency: d.currency ?? 'CFA',
    contactName: d.contactName ?? undefined,
    contactPhone: d.contactPhone ?? undefined,
    packageName: d.packageName ?? undefined,
    weightKg: d.weightKg ?? undefined,
    dimensionsL: d.dimensionsL ?? undefined,
    dimensionsW: d.dimensionsW ?? undefined,
    dimensionsH: d.dimensionsH ?? undefined,
    packageType: d.packageType ?? undefined,
    scheduledAt: d.scheduledAt?.toISOString?.() ?? undefined,
    createdAt: d.createdAt?.toISOString?.() ?? undefined,
    startedAt: d.startedAt?.toISOString?.() ?? undefined,
    completedAt: d.completedAt?.toISOString?.() ?? undefined,
  }
}

export default async function DeliveriesPage({
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

  await expireDeliveriesForCompany(session.companyId)

  const { from, to } = await searchParams
  const fromDate = parseYmd(from)
  const toDate = parseYmd(to)
  if (toDate) toDate.setHours(23, 59, 59, 999)

  const [deliveries, drivers, vehicles] = await Promise.all([
    prisma.delivery.findMany({
      where: {
        companyId: session.companyId,
        ...(fromDate || toDate
          ? { createdAt: { ...(fromDate ? { gte: fromDate } : {}), ...(toDate ? { lte: toDate } : {}) } }
          : {}),
      },
      include: { driver: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.driver.findMany({
      where: { companyId: session.companyId },
      select: { id: true, name: true, code: true },
    }),
    prisma.vehicle.findMany({
      where: { companyId: session.companyId },
      select: { id: true, name: true, plateNumber: true },
    }),
  ])

  const initialDeliveries: DeliveryRow[] = deliveries.map(mapToRow)
  const initialDrivers: DriverOption[] = drivers.map((d) => ({ id: d.id, name: d.name, code: d.code }))
  const initialVehicles: VehicleOption[] = vehicles.map((v) => ({
    id: v.id,
    name: v.name,
    plateNumber: v.plateNumber ?? null,
  }))

  return (
    <DeliveriesClient
      initialDeliveries={initialDeliveries}
      initialDrivers={initialDrivers}
      initialVehicles={initialVehicles}
      initialFrom={from ?? null}
      initialTo={to ?? null}
      companyCreatedAt={companyCreatedAtYmd}
    />
  )
}
