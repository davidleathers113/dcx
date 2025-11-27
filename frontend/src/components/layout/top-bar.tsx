'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CalendarDays,
  CircleDollarSign,
  Menu,
  Plus,
  SquarePen,
  X
} from 'lucide-react';
import { useMemo } from 'react';
import { navSections } from './navigation';
import { useDashboardStats } from '@/lib/hooks/useDashboardStats';

type QuickAction = {
  icon: typeof Plus;
  label: string;
};

const quickActions: QuickAction[] = [
  { icon: SquarePen, label: 'Edit Board' },
  { icon: Plus, label: 'Add Widget' }
];

export function TopBar() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const range = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return { from: from.toISOString(), to: now.toISOString() };
  }, []);
  const dashboardStats = useDashboardStats(range);
  const balanceDisplay = dashboardStats.loading
    ? '—'
    : formatMoney(dashboardStats.profitCents);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex rounded-md border border-slate-800 bg-slate-900 p-2 text-slate-200 md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-600"
          >
            <CalendarDays className="h-4 w-4 text-slate-400" />
            Today
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {/* Manually mirrored Trackdrive quick action affordances */}
          {quickActions.map((action) => (
            <QuickActionButton key={action.label} action={action} />
          ))}
        </div>

        <div className="flex items-center gap-3">
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
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-3 py-1">
            <span
              className={`h-2 w-2 rounded-full ${
                dashboardStats.backendHealthy ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span className="text-xs font-semibold text-slate-200">DC</span>
            <span className="hidden sm:inline text-[11px] text-slate-400">
              {dashboardStats.backendHealthy ? 'Systems Nominal' : 'Investigate API'}
            </span>
          </div>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </>
  );
}

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

