import type { DashboardStats } from '@/utils/types';

const ACTIVE_STATUSES = ['PENDING', 'LOADING', 'TRANSIT', 'DELAYED'] as const;

export type DeliveryStatus =
  | (typeof ACTIVE_STATUSES)[number]
  | 'COMPLETED'
  | 'CANCELLED';

export function isActiveDeliveryStatus(status: string): boolean {
  return ACTIVE_STATUSES.includes(status as (typeof ACTIVE_STATUSES)[number]);
}

type StatsLike = Pick<
  DashboardStats,
  'activeDeliveries' | 'completedThisMonth' | 'co2SavedKg' | 'totalRevenue'
>;

type DeliveryLike = {
  status: string;
  amount?: number | null;
};

export function computeDashboardStatsFromDeliveries(
  deliveries: DeliveryLike[],
  base: DashboardStats,
  range?: { from?: string | null; to?: string | null }
): DashboardStats {
  const active = deliveries.filter((d) => isActiveDeliveryStatus(d.status)).length;
  const completed = deliveries.filter((d) => d.status === 'COMPLETED').length;
  const co2Saved = Math.round(completed * 0.5);
  const totalRevenue = deliveries
    .filter((d) => d.status === 'COMPLETED')
    .reduce((sum, d) => sum + (d.amount || 0), 0);

  const statsUpdate: StatsLike & { from?: string | null; to?: string | null } = {
    activeDeliveries: active,
    completedThisMonth: completed,
    co2SavedKg: co2Saved,
    totalRevenue,
    from: range?.from ?? base.from ?? null,
    to: range?.to ?? base.to ?? null,
  };

  return {
    ...base,
    ...statsUpdate,
  };
}


type Expirable = {
  status: string;
  scheduledAt?: string | Date | null;
};

export function isDeliveryExpiredBySchedule(
  row: Expirable,
  now: Date = new Date()
): boolean {
  if (row.status === 'COMPLETED' || row.status === 'CANCELLED' || row.status === 'EXPIRED') return false;
  if (!row.scheduledAt) return false;
  const d =
    typeof row.scheduledAt === 'string'
      ? new Date(row.scheduledAt)
      : row.scheduledAt;
  if (!d || Number.isNaN(d.getTime())) return false;
  return d < now;
}

/** Alias pour compatibilité (afficher "Livraison expirée" selon le statut ou la date). */
export const isDeliveryExpired = isDeliveryExpiredBySchedule;


