'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateVehicle(
  id: string,
  data: { name?: string; plateNumber?: string | null; status?: string }
) {
  const session = await getSession()
  if (!session) throw new Error('Non authentifié')
  const existing = await prisma.vehicle.findFirst({
    where: { id, companyId: session.companyId },
  })
  if (!existing) throw new Error('Véhicule introuvable')
  const updated = await prisma.vehicle.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.plateNumber !== undefined && { plateNumber: data.plateNumber || null }),
      ...(data.status !== undefined && { status: data.status as 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' }),
    },
  })
  revalidatePath('/dashboard/vehicles')
  return updated
}

export async function deleteVehicle(id: string) {
  const session = await getSession()
  if (!session) throw new Error('Non authentifié')
  const existing = await prisma.vehicle.findFirst({
    where: { id, companyId: session.companyId },
  })
  if (!existing) throw new Error('Véhicule introuvable')
  await prisma.vehicle.delete({ where: { id } })
  revalidatePath('/dashboard/vehicles')
}
