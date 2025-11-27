// frontend/src/app/buyers/page.tsx
import { apiClient } from '@/lib/api';
import type { components } from '@/types/api';
import { BuyersTable } from '@/components/buyers/table';

// Manually forcing dynamic rendering so Next.js builds skip backend-dependent prerender.
export const dynamic = 'force-dynamic';

type Buyer = components['schemas']['Buyer'];
type PaginatedBuyers = {
  data: Buyer[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

async function getBuyers(): Promise<Buyer[]> {
  const { data, error } = await apiClient.GET('/api/buyers', {
    params: {
      query: {
        page: 1,
        limit: 20
      }
    }
  });

  if (error) {
    console.error('Error fetching buyers:', error);
    return [];
  }

  // data is the envelope: { data: Buyer[]; meta: { ... } }
  const envelope = data as PaginatedBuyers;
  return (envelope?.data ?? []) as Buyer[];
}

export default async function BuyersPage() {
  const buyers = await getBuyers();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Buyers</h1>
            <p className="text-sm text-slate-400 mt-1">
              Registered buyers in the DCX backend.
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <BuyersTable buyers={buyers} />
        </section>
      </div>
    </main>
  );
}
