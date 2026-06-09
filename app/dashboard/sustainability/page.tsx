import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import SustainabilityClient from './SustainabilityClient'

export default async function SustainabilityPage() {
  const session = await requireAuth()

  const metrics = await prisma.sustainabilityMetric.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: 'desc' },
    take: 24,
  })

  const initialMetrics = metrics.map((m) => ({
    period: m.period,
    co2AvoidedTonnes: m.co2AvoidedTonnes,
    co2TargetTonnes: m.co2TargetTonnes,
    fuelEfficiencyPct: m.fuelEfficiencyPct,
    fleetAvgLPer100km: m.fleetAvgLPer100km,
    evUsagePct: m.evUsagePct,
    evActiveCount: m.evActiveCount,
    treesEquivalent: m.treesEquivalent,
    savingsEur: m.savingsEur,
    timeSavedHours: m.timeSavedHours,
    ecoScore: m.ecoScore,
    createdAt: m.createdAt.toISOString(),
  }))

  return <SustainabilityClient initialMetrics={initialMetrics} />
}
