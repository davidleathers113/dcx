// frontend/src/app/page.tsx
import { apiClient } from '@/lib/api';
import type { components } from '@/types/api';

// Corrected type name: PaginatedCallSessions
type PaginatedCallSessions = components['schemas']['PaginatedCallSessions'];
type CallSession = components['schemas']['CallSession'];

type DashboardStats = {
  callsToday: number;
  revenueTodayCents: number;
  costTodayCents: number;
  profitTodayCents: number;
  backendHealthy: boolean;
};

async function getDashboardStats(): Promise<DashboardStats> {
  // Compute start/end of "today" in UTC (simple but good enough for V1).
  const now = new Date();
  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  const fromIso = start.toISOString();
  const toIso = end.toISOString();

  // Fetch calls for today (up to 1000 rows; enough for early stage)
  const { data, error } = await apiClient.GET('/api/calls', {
    params: {
      query: {
        from: fromIso,
        to: toIso,
        page: 1,
        limit: 1000
      }
    }
  });

  let calls: CallSession[] = [];
  let total = 0;

  if (!error && data) {
    // Cast to the correct PaginatedCallSessions type
    const envelope = data as PaginatedCallSessions;
    calls = envelope.data ?? [];
    total = envelope.meta?.total ?? calls.length;
  }

  const revenueTodayCents = calls.reduce(
    (sum, c) => sum + (c.revenue_estimated_cents ?? 0),
    0
  );
  const costTodayCents = calls.reduce(
    (sum, c) => sum + (c.telephony_cost_cents ?? 0),
    0
  );
  const profitTodayCents = revenueTodayCents - costTodayCents;

  // Check backend health separately
  let backendHealthy = false;
  try {
    const { data: healthData } = await apiClient.GET('/health');
    backendHealthy = healthData?.status === 'ok';
  } catch {
    backendHealthy = false;
  }

  return {
    callsToday: total,
    revenueTodayCents,
    costTodayCents,
    profitTodayCents,
    backendHealthy
  };
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const profitClass =
    stats.profitTodayCents > 0
      ? 'text-emerald-300'
      : stats.profitTodayCents < 0
      ? 'text-rose-300'
      : 'text-amber-300';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              High-level view of today&apos;s call economics.
            </p>
          </div>
        </header>

        {/* Quick Stats */}
        <section className="grid gap-4 md:grid-cols-3">
          {/* Calls Today */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                Calls Today
              </h2>
            </div>
            <div className="text-3xl font-semibold">
              {stats.callsToday}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Count of calls created between local midnight and now.
            </p>
          </div>

          {/* Revenue Today */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                Revenue Today
              </h2>
            </div>
            <div className="text-3xl font-semibold text-emerald-300">
              {formatMoney(stats.revenueTodayCents)}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Includes duration-based payouts and any posted conversions.
            </p>
          </div>

          {/* Profit Today */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-medium text-slate-300 uppercase tracking-wide">
                Profit Today
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  stats.backendHealthy
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/40'
                }`}
              >
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current" />
                {stats.backendHealthy ? 'Backend Online' : 'Backend Down'}
              </span>
            </div>
            <div className={`text-3xl font-semibold ${profitClass}`}>
              {formatMoney(stats.profitTodayCents)}
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              Revenue minus telephony cost for all calls today.
            </p>
          </div>
        </section>

        {/* You can add quick links / recent calls preview here later */}
      </div>
    </div>
  );
}