'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function deleteDriver(id: string) {
  const session = await getSession()
  if (!session?.companyId) throw new Error('Non authentifié')

  const existing = await prisma.driver.findFirst({
    where: { id, companyId: session.companyId },
  })
  if (!existing) throw new Error('Chauffeur introuvable')

  await prisma.driver.delete({ where: { id } })
  revalidatePath('/dashboard/fleet')
}

export type UpdateDriverPayload = {
  name?: string
  email?: string | null
  phone?: string | null
  role?: string | null
  status?: 'ACTIVE' | 'IDLE' | 'MAINTENANCE'
  region?: string | null
  vehicleId?: string | null
  licenseExpiry?: string | null      // format YYYY-MM-DD
  avatarUrl?: string | null
}

export async function updateDriver(id: string, data: UpdateDriverPayload) {
  const session = await getSession()
  if (!session?.companyId) throw new Error('Non authentifié')

  const existing = await prisma.driver.findFirst({
    where: { id, companyId: session.companyId },
  })
  if (!existing) throw new Error('Chauffeur introuvable')

  const updated = await prisma.driver.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email || null }),
      ...(data.phone !== undefined && { phone: data.phone || null }),
      ...(data.role !== undefined && { role: data.role || null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.region !== undefined && { region: data.region || null }),
      ...(data.vehicleId !== undefined && { vehicleId: data.vehicleId || null }),
      ...(data.licenseExpiry !== undefined && { 
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : null 
      }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl || null }),
    },
    include: { vehicle: { select: { name: true, plateNumber: true } } },
  })

  revalidatePath('/dashboard/fleet')
  return updated
}

export async function updateDriverStatus(id: string, status: 'ACTIVE' | 'IDLE' | 'MAINTENANCE') {
  const session = await getSession()
  if (!session?.companyId) throw new Error('Non authentifié')

  const existing = await prisma.driver.findFirst({
    where: { id, companyId: session.companyId },
  })
  if (!existing) throw new Error('Chauffeur introuvable')

  const updated = await prisma.driver.update({
    where: { id },
    data: { status },
    include: { vehicle: { select: { name: true, plateNumber: true } } },
  })

  revalidatePath('/dashboard/fleet')
  return updated
}

// Pour la page serveur – récupération initiale
export async function getFleetData() {
  const session = await getSession()
  if (!session?.companyId) throw new Error('Non authentifié')

  const [drivers, vehicles] = await Promise.all([
    prisma.driver.findMany({
      where: { companyId: session.companyId },
      include: { vehicle: { select: { id: true, name: true, plateNumber: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.vehicle.findMany({
      where: { companyId: session.companyId },
      select: { id: true, name: true, plateNumber: true },
    }),
  ])

  return {
    drivers: drivers.map(d => ({
      id: d.id,
      code: d.code,
      name: d.name,
      email: d.email ?? '',
      phone: d.phone ?? null,
      role: d.role ?? null,
      status: d.status,
      region: d.region ?? null,
      vehicleName: d.vehicle?.name ?? null,
      vehicleId: d.vehicleId ?? null,
      avatarUrl: d.avatarUrl ?? null,
      licenseExpiry: d.licenseExpiry
        ? d.licenseExpiry.toISOString().slice(0, 10)
        : null,
    })),
    vehicles: vehicles.map(v => ({
      id: v.id,
      name: v.name,
      plateNumber: v.plateNumber ?? null,
    })),
  }
}