import { prisma } from '@/lib/db'

/**
 * Passe en EXPIRED les livraisons actives dont scheduledAt est dépassé.
 * À appeler côté serveur avant de lire les livraisons (dashboard, page livraisons).
 */
export async function expireDeliveriesForCompany(companyId: string): Promise<number> {
  const now = new Date()
  const result = await prisma.delivery.updateMany({
    where: {
      companyId,
      status: { in: ['PENDING', 'LOADING', 'TRANSIT', 'DELAYED'] },
      scheduledAt: { lt: now },
    },
    data: { status: 'EXPIRED' },
  })
  return result.count
}
