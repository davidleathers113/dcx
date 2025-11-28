// frontend/src/app/campaigns/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useCampaigns } from '@/lib/hooks/useCampaigns';
import { CampaignsTable } from '@/components/campaigns/table';
import { CampaignFilterSidebar } from '@/components/campaigns/campaign-filter-sidebar';
import { useMemo } from 'react';

export default function CampaignsPage() {
  const searchParams = useSearchParams();
  
  // Create a filters object from the search params
  const filters = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    const filtersObj: Record<string, string> = {};
    params.forEach((value, key) => {
        // The key from URLSearchParams might be 'filters[status]'
        // We just pass the whole object to the hook
        const match = key.match(/filters\[(.*?)\]/);
        if (match) {
            filtersObj[match[1]] = value;
        }
    });
    return filtersObj;
  }, [searchParams]);

  const { campaigns, loading, error } = useCampaigns(filters);
  
  const activeCount = useMemo(() => campaigns.filter((c) => c.status === 'ACTIVE').length, [campaigns]);
  const inactiveCount = useMemo(() => campaigns.filter((c) => c.status === 'INACTIVE').length, [campaigns]);
  const verticals = useMemo(() => new Set(campaigns.map((c) => c.vertical)), [campaigns]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
            <p className="text-sm text-slate-400">
              Live configuration from the DCX backend, mirroring the Trackdrive setup
              system.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:border-slate-600">
              Import Config
            </button>
            <button className="rounded-lg border border-emerald-600 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/20">
              New Campaign
            </button>
          </div>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard label="Active" value={activeCount} helper="Currently routing calls" />
          <SummaryCard
            label="Inactive"
            value={inactiveCount}
            helper="Paused or scheduling off"
          />
          <SummaryCard
            label="Verticals"
            value={verticals.size}
            helper="Unique campaign categories"
          />
        </section>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-1">
                <CampaignFilterSidebar />
            </div>
            <div className="lg:col-span-3">
                <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
                  {loading && <div className="text-center p-8">Loading campaigns...</div>}
                  {error && <div className="text-center p-8 text-rose-400">Error loading campaigns.</div>}
                  {!loading && !error && <CampaignsTable campaigns={campaigns} />}
                </section>
            </div>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  helper
}: {
  label: string;
  value: number;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-slate-900 bg-slate-950/70 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500">{helper}</p>
    </div>
  );
}
