// frontend/src/app/calls/page.tsx
import { apiClient } from '@/lib/api';
import type { components } from '@/types/api';
import { CallsTable } from '@/components/calls/table';

// Manually forcing dynamic rendering so Next.js builds skip backend-dependent prerender.
export const dynamic = 'force-dynamic';

type CallSession = components['schemas']['CallSession'];
type PaginatedCallSessions = components['schemas']['PaginatedCallSessions'];

async function getCalls(): Promise<CallSession[]> {
  const { data, error } = await apiClient.GET('/api/calls', {
    params: {
      query: {
        page: 1,
        limit: 20
      }
    }
  });

  if (error) {
    console.error('Error fetching calls:', JSON.stringify(error, null, 2));
    return [];
  }

  // data is the envelope: { data: CallSession[]; meta: { ... } }
  const envelope = data as PaginatedCallSessions;
  return (envelope?.data ?? []) as CallSession[];
}

export default async function CallsPage() {
  const calls = await getCalls();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Calls</h1>
            <p className="text-sm text-slate-400 mt-1">
              Live call sessions from the DCX backend.
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          <CallsTable calls={calls} />
        </section>
      </div>
    </main>
  );
}
