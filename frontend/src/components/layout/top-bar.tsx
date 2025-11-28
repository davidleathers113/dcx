'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CalendarDays,
  CircleDollarSign,
  Menu,
  PhoneCall, // <-- Import PhoneCall icon
  Plus,
  SquarePen,
  X
} from 'lucide-react';
import { useMemo } from 'react';
import { navSections } from './navigation';
import { useDashboardStats } from '@/lib/hooks/useDashboardStats';
import { useLiveMetrics } from '@/lib/hooks/useLiveMetrics'; // <-- Import the new hook

// ... (existing code)

export function TopBar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { liveCallCount, isConnected } = useLiveMetrics(); // <-- Use the hook
  const range = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: now.toISOString() };
  }, []);
  const dashboardStats = useDashboardStats(range);
  const balanceDisplay = dashboardStats.loading
    ? '—'
    : formatMoney(dashboardStats.profitCents);
  
  const liveCallDisplay = liveCallCount === null ? '...' : liveCallCount;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur">
        {/* ... (existing code) */}

        <div className="flex items-center gap-3">
          {/* Live Call Counter */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-slate-200">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <PhoneCall className="h-4 w-4 text-slate-400" />
            </div>
            {liveCallDisplay} Live
          </div>
          
          <div className="hidden sm:flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
            <CircleDollarSign className="h-4 w-4" />
            {balanceDisplay}
          </div>
          <button
            type="button"
            className="rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-300 hover:border-slate-600"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
          </button>
          {/* ... (existing code) */}
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}

// ... (existing code)


function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function QuickActionButton({ action }: { action: QuickAction }) {
  const Icon = action.icon;
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 hover:border-slate-600"
    >
      <Icon className="h-4 w-4 text-slate-400" />
      {action.label}
    </button>
  );
}

type MobileNavProps = {
  open: boolean;
  onClose: () => void;
};

function MobileNav({ open, onClose }: MobileNavProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        role="presentation"
      />
      <div className="relative ml-auto flex h-full w-72 flex-col border-l border-slate-800 bg-slate-950 px-4 py-5 shadow-xl">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-300">
            Navigate Dependable Call Exchange
          </p>
          <button
            type="button"
            className="rounded-full border border-slate-800 bg-slate-900 p-1 text-slate-300"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 flex-1 overflow-y-auto space-y-4">
          {navSections.map((section) => (
            <div key={section.id}>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                {section.label}
              </p>
              <div className="mt-2 space-y-1">
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-md border border-slate-900 bg-slate-900/50 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-700"
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

