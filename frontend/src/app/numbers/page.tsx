// frontend/src/app/numbers/page.tsx
import { apiClient } from '@/lib/api';
import type { components } from '@/types/api';
import { NumbersTable } from '@/components/numbers/table';

// Manually forcing dynamic rendering so Next.js builds skip backend-dependent prerender.
export const dynamic = 'force-dynamic';

type PhoneNumber = components['schemas']['PhoneNumber'];
type PaginatedPhoneNumbers = {
  data: PhoneNumber[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
};

async function getPhoneNumbers(): Promise<PhoneNumber[]> {
  const { data, error } = await apiClient.GET('/api/numbers', {
    params: {
      query: {
        page: 1,
        limit: 20
      }
    }
  });

  if (error) {
    console.error('Error fetching phone numbers:', error);
    return [];
  }

  // data is the envelope: { data: PhoneNumber[]; meta: { ... } }
  const envelope = data as PaginatedPhoneNumbers;
  return (envelope?.data ?? []) as PhoneNumber[];
}

export default async function NumbersPage() {
  const phoneNumbers = await getPhoneNumbers();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Numbers</h1>
            <p className="text-sm text-slate-400 mt-1">
              Managed phone numbers in the DCX backend.
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <NumbersTable phoneNumbers={phoneNumbers} />
        </section>
      </div>
    </main>
  );
}
