// frontend/src/components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils'; // if you don't have this, see note below

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard
  },
  {
    label: 'Campaigns',
    href: '/campaigns',
    icon: Megaphone
  },
  {
    label: 'Calls',
    href: '/calls',
    icon: Phone
  }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-60 border-r border-slate-800 bg-slate-950/95 text-slate-100">
      <div className="px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-semibold">
            DCX
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">
              Dependable Call Exchange
            </div>
            <div className="text-[11px] text-slate-500">
              Admin Console
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.some((item) => item.href === pathname) ? null : (
          <span className="sr-only">Current section: {pathname}</span>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                'hover:bg-slate-900 hover:text-slate-50',
                isActive
                  ? 'bg-slate-900 text-slate-50 border border-slate-700'
                  : 'text-slate-400'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-3 border-t border-slate-800 text-[11px] text-slate-500">
        <div>V1 · Profit-Aware</div>
        <div className="mt-1">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1" />
          Live Exchange
        </div>
      </div>
    </aside>
  );
}
