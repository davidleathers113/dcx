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
        limit: 20
      }
    }
  });

  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }

  // data is the envelope: { data: Campaign[]; meta: { ... } }
  return (data?.data ?? []) as Campaign[];
}

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Campaigns
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Live configuration from the DCX backend.
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <CampaignsTable campaigns={campaigns} />
        </section>
      </div>
    </main>
  );
}
