// frontend/src/app/campaigns/page.tsx
import { apiClient } from '@/lib/api';
import type { components } from '@/types/api';
import { CampaignsTable } from '@/components/campaigns/table';

// Manually forcing dynamic rendering so Next.js builds skip backend-dependent prerender.
export const dynamic = 'force-dynamic';

type Campaign = components['schemas']['Campaign'];

async function getCampaigns(): Promise<Campaign[]> {
  const { data, error } = await apiClient.GET('/api/campaigns', {
    params: {
      query: {
        page: 1,
        limit: 50
      }
    }
  });

  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }

  return (data?.data ?? []) as Campaign[];
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();
  const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const inactiveCount = campaigns.filter((c) => c.status === 'INACTIVE').length;
  const verticals = new Set(campaigns.map((c) => c.vertical));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
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

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

        <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
          <CampaignsTable campaigns={campaigns} />
        </section>
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
