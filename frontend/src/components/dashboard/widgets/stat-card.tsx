import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  badge?: ReactNode;
  accent?: 'emerald' | 'rose' | 'amber';
};

// Manually extracted stat card for reusable KPI presentation.
export function StatCard({
  title,
  value,
  description,
  badge,
  accent = 'emerald'
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="uppercase tracking-wide">{title}</span>
        {badge}
      </div>
      <div
        className={cn(
          'mt-3 text-3xl font-semibold text-slate-100',
          accent === 'emerald' && 'text-emerald-300',
          accent === 'rose' && 'text-rose-300',
          accent === 'amber' && 'text-amber-200'
        )}
      >
        {value}
      </div>
      {description ? (
        <p className="mt-2 text-[11px] text-slate-500">{description}</p>
      ) : null}
    </div>
  );
}

