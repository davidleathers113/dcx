// frontend/src/components/layout/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils'; // if you don't have this, see note below
import { navSections, type NavSectionConfig } from './navigation';

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-slate-800 bg-slate-950/95 text-slate-100">
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

      <div className="px-5 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase text-slate-500 tracking-wide">Company</p>
            <p className="text-sm font-semibold text-slate-50">Dependable Call Exchange</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-[11px] text-slate-400 hover:border-slate-600 hover:text-slate-200"
          >
            Change
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {/* Manually render nested nav tree to mimic Trackdrive sidebar affordances */}
        {navSections.map((section) => (
          <NavSection key={section.id} section={section} pathname={pathname} />
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Balance</span>
          <span className="font-semibold text-emerald-300">$0.00</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Live Exchange</span>
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
        <Link href="/support" className="text-slate-400 hover:text-slate-200">
          Support Center →
        </Link>
      </div>
    </aside>
  );
}

type NavSectionProps = {
  section: NavSectionConfig;
  pathname: string;
};

function NavSection({ section, pathname }: NavSectionProps) {
  const isCurrentSection = section.items.some((item) =>
    matchPath(pathname, item.href)
  );
  const SectionIcon = section.icon;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500',
          isCurrentSection && 'text-slate-200'
        )}
      >
        <SectionIcon className="h-3.5 w-3.5" />
        <span>{section.label}</span>
      </div>
      <div className="space-y-1">
        {section.items.map((item) => {
          const isActive = matchPath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between rounded-md px-3 py-1.5 text-xs transition-colors',
                'hover:bg-slate-900 hover:text-slate-50',
                isActive
                  ? 'bg-slate-900 text-slate-50 border border-slate-700'
                  : 'text-slate-400'
              )}
            >
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function matchPath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(href);
}
