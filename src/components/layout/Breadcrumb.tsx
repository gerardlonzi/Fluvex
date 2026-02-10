'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  fleet: 'Gestion de Flotte',
  deliveries: 'Livraisons',
  map: 'Carte en temps réel',
  analytics: 'Analytique',
  drivers: 'Performance',
  sustainability: 'Impact Écologique',
  settings: 'Paramètres',
  new: 'Nouveau',
};

function getSegmentLabel(segment: string, prevSegment?: string): string {
  if (segment in SEGMENT_LABELS) {
    if (segment === 'new' && prevSegment === 'deliveries') return 'Nouvelle livraison';
    if (segment === 'new' && prevSegment === 'fleet') return 'Nouveau chauffeur';
    return SEGMENT_LABELS[segment];
  }
  return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
}

export function Breadcrumb() {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const items: { href: string; label: string }[] = [];
  let acc = '';
  for (let i = 0; i < segments.length; i++) {
    acc += (acc ? '/' : '') + segments[i];
    const label = getSegmentLabel(segments[i], segments[i - 1]);
    items.push({ href: acc, label });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-text-muted hover:text-text-main transition-colors text-sm font-medium p-1.5 -ml-1.5 rounded-lg hover:bg-border/50"
        aria-label="Retour"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Retour</span>
      </button>
      <span className="text-border w-px h-4" aria-hidden />
      <nav className="flex items-center text-sm text-text-muted" aria-label="Fil d'Ariane">
        <ol className="flex flex-wrap items-center gap-1.5">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="w-4 h-4 shrink-0 text-border" />}
                {isLast ? (
                  <span className="font-medium text-text-main">{item.label}</span>
                ) : (
                  <Link
                    href={"/" + item.href}
                    className="hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
