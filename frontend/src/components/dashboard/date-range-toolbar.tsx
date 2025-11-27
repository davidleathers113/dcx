'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DashboardRangeKey = 'today' | 'last_24h' | 'last_7d';

const rangeOptions: { key: DashboardRangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'last_24h', label: 'Last 24h' },
  { key: 'last_7d', label: 'Last 7 Days' }
];

type DateRangeToolbarProps = {
  activeRange: DashboardRangeKey;
  description: string;
};

// Manually added toolbar to control dashboard range via query params.
export function DateRangeToolbar({ activeRange, description }: DateRangeToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSelectRange(key: DashboardRangeKey) {
    const params = new URLSearchParams(searchParams);
    if (key === 'today') {
      params.delete('range');
    } else {
      params.set('range', key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <CalendarDays className="h-4 w-4 text-slate-500" />
        Showing {description}
      </div>
      <div className="flex flex-wrap gap-2">
        {rangeOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => handleSelectRange(option.key)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              activeRange === option.key
                ? 'border-slate-200 bg-slate-100/10 text-slate-100'
                : 'border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-100'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

