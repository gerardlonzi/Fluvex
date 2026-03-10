'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function deleteDelivery(id: string) {
  const session = await getSession()
  if (!session) throw new Error('Non authentifié')
  const existing = await prisma.delivery.findFirst({
    where: { id, companyId: session.companyId },
  })
  if (!existing) throw new Error('Livraison introuvable')
  await prisma.delivery.delete({ where: { id } })
  revalidatePath('/dashboard/deliveries')
}

export type UpdateDeliveryPayload = {
  status?: string
  driverId?: string | null
  vehicleId?: string | null
  recipientCompany?: string | null
  deliveryAddress?: string | null
  contactName?: string | null
  contactPhone?: string | null
  amount?: number | null
  currency?: string
}

export async function updateDelivery(id: string, data: UpdateDeliveryPayload) {
  const session = await getSession()
  if (!session) throw new Error('Non authentifié')
  const existing = await prisma.delivery.findFirst({
    where: { id, companyId: session.companyId },
  })
  if (!existing) throw new Error('Livraison introuvable')
  const updated = await prisma.delivery.update({
    where: { id },
    data: {
      ...(data.status !== undefined && { status: data.status as 'PENDING' | 'LOADING' | 'TRANSIT' | 'DELAYED' | 'COMPLETED' | 'CANCELLED' }),
      ...(data.driverId !== undefined && { driverId: data.driverId || null }),
      ...(data.vehicleId !== undefined && { vehicleId: data.vehicleId || null }),
      ...(data.recipientCompany !== undefined && { recipientCompany: data.recipientCompany }),
      ...(data.deliveryAddress !== undefined && { deliveryAddress: data.deliveryAddress }),
      ...(data.contactName !== undefined && { contactName: data.contactName }),
      ...(data.contactPhone !== undefined && { contactPhone: data.contactPhone }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.currency !== undefined && { currency: data.currency }),
    },
    include: { driver: { select: { name: true } } },
  })
  revalidatePath('/dashboard/deliveries')
  return updated
}

export async function cancelDelivery(id: string) {
  const session = await getSession()
  if (!session) throw new Error('Non authentifié')
  const existing = await prisma.delivery.findFirst({
    where: { id, companyId: session.companyId },
  })
  if (!existing) throw new Error('Livraison introuvable')
  const updated = await prisma.delivery.update({
    where: { id },
    data: { status: 'CANCELLED' },
    include: { driver: { select: { name: true } } },
  })
  revalidatePath('/dashboard/deliveries')
  return updated
}

export async function refreshDeliveries() {
  revalidatePath('/dashboard/deliveries')
}
