// frontend/src/app/page.tsx
import type { ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { DateRangeToolbar, type DashboardRangeKey } from '@/components/dashboard/date-range-toolbar';
import { StatCard } from '@/components/dashboard/widgets/stat-card';
import { WidgetCard } from '@/components/dashboard/widgets/widget-card';
import { CallsByStatusChart } from '@/components/dashboard/widgets/calls-by-status-chart';
import { cn } from '@/lib/utils';
import type { components } from '@/types/api';

// Manually forcing dynamic rendering so Next.js builds skip backend-dependent prerender.
export const dynamic = 'force-dynamic';

// Corrected type name: PaginatedCallSessions
type PaginatedCallSessions = components['schemas']['PaginatedCallSessions'];
type CallSession = components['schemas']['CallSession'];

type DashboardStats = {
  callsToday: number;
  revenueTodayCents: number;
  costTodayCents: number;
  profitTodayCents: number;
  backendHealthy: boolean;
  calls: CallSession[];
};

type DashboardWidgetConfig = {
  id: string;
  className: string;
  node: ReactNode;
};

type DashboardRangeSelection = {
  key: DashboardRangeKey;
  label: string;
  from: Date;
  to: Date;
};

const rangeLabels: Record<DashboardRangeKey, string> = {
  today: 'Today',
  last_24h: 'Last 24 Hours',
  last_7d: 'Last 7 Days'
};

function resolveRange(rangeParam?: string): DashboardRangeSelection {
  const now = new Date();
  const key: DashboardRangeKey =
    rangeParam === 'last_24h' || rangeParam === 'last_7d' ? rangeParam : 'today';

  let from: Date;
  if (key === 'today') {
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  } else if (key === 'last_24h') {
    from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else {
    from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  return {
    key,
    label: rangeLabels[key],
    from,
    to: now
  };
}

async function getDashboardStats(range: DashboardRangeSelection): Promise<DashboardStats> {
  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  // Fetch calls for selected range (up to 1000 rows; enough for early stage)
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
    backendHealthy,
    calls
  };
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

type DashboardPageProps = {
  searchParams?: {
    range?: string;
  };
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const range = resolveRange(searchParams?.range);
  const stats = await getDashboardStats(range);

  const totalDurationSeconds = stats.calls.reduce(
    (sum, call) => sum + (call.duration_seconds ?? 0),
    0
  );
  const avgMinutes =
    stats.callsToday > 0 ? totalDurationSeconds / stats.callsToday / 60 : 0;
  const revenuePerCall =
    stats.callsToday > 0 ? stats.revenueTodayCents / stats.callsToday : 0;
  const liveCalls = stats.calls.filter((call) => call.status === 'IN_PROGRESS').length;
  const completedCalls = stats.calls.filter((call) => call.status === 'COMPLETED').length;

  const statusData = Object.entries(
    stats.calls.reduce<Record<string, number>>((acc, call) => {
      acc[call.status] = (acc[call.status] ?? 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({ status, count }));

  const topLineStats = [
    {
      title: 'Calls',
      value: stats.callsToday.toLocaleString(),
      description: `${range.label} · Includes initiated + completed`,
      accent: 'emerald'
    },
    {
      title: 'Revenue',
      value: formatMoney(stats.revenueTodayCents),
      description: 'Duration-based payouts plus conversions',
      accent: 'emerald'
    },
    {
      title: 'Profit',
      value: formatMoney(stats.profitTodayCents),
      description: 'Revenue minus telephony cost',
      accent:
        stats.profitTodayCents > 0 ? 'emerald' : stats.profitTodayCents < 0 ? 'rose' : 'amber'
    },
    {
      title: 'Avg Minutes',
      value: `${avgMinutes.toFixed(2)} min`,
      description: 'Per connected call during selected range',
      accent: 'amber'
    }
  ] as const;

  const widgetConfigs = createWidgetConfigs({
    statusData,
    liveCalls,
    totalCalls: stats.callsToday,
    avgMinutes,
    revenuePerCall,
    completedCalls,
    backendHealthy: stats.backendHealthy
  });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 lg:px-0">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics Overview</h1>
          <p className="text-sm text-slate-400">
            Live metrics for Dependable Call Exchange, inspired by Trackdrive&apos;s board.
          </p>
        </div>
        <DateRangeToolbar activeRange={range.key} description={range.label} />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {topLineStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            accent={stat.accent as 'emerald' | 'rose' | 'amber'}
            badge={
              stat.title === 'Profit' ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]',
                    stats.backendHealthy
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {stats.backendHealthy ? 'Backend Online' : 'Backend Down'}
                </span>
              ) : undefined
            }
          />
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-12">
        {widgetConfigs.map((widget) => (
          <div key={widget.id} className={cn('col-span-12', widget.className)}>
            {widget.node}
          </div>
        ))}
      </section>
    </div>
  );
}

function createWidgetConfigs({
  statusData,
  liveCalls,
  totalCalls,
  avgMinutes,
  revenuePerCall,
  completedCalls,
  backendHealthy
}: {
  statusData: { status: string; count: number }[];
  liveCalls: number;
  totalCalls: number;
  avgMinutes: number;
  revenuePerCall: number;
  completedCalls: number;
  backendHealthy: boolean;
}): DashboardWidgetConfig[] {
  return [
    {
      id: 'live-summary',
      className: 'lg:col-span-4',
      node: (
        <WidgetCard
          title="Calls In Progress"
          description="Forwarded vs total during the filtered range"
          footer={
            backendHealthy ? 'Routing healthy' : 'Routing degraded · check carriers'
          }
        >
          <LiveSummary
            liveCalls={liveCalls}
            totalCalls={totalCalls}
            completedCalls={completedCalls}
          />
        </WidgetCard>
      )
    },
    {
      id: 'calls-by-status',
      className: 'lg:col-span-4',
      node: (
        <WidgetCard
          title="Calls By Status"
          description="Status mix for all calls in the selected window"
        >
          <CallsByStatusChart data={statusData} />
        </WidgetCard>
      )
    },
    {
      id: 'quality',
      className: 'lg:col-span-4',
      node: (
        <WidgetCard
          title="Average Call Length"
          description="Minutes per connected call plus monetization"
          footer={`Revenue per call ${formatMoney(revenuePerCall)}`}
        >
          <div className="flex flex-col gap-4">
            <div className="text-4xl font-semibold text-slate-100">
              {avgMinutes.toFixed(2)}
              <span className="ml-1 text-base text-slate-400">mins</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
              <div className="rounded-lg border border-slate-900 bg-slate-950/50 p-3">
                <p className="font-semibold text-slate-100">{completedCalls}</p>
                <p>Completed</p>
              </div>
              <div className="rounded-lg border border-slate-900 bg-slate-950/50 p-3">
                <p className="font-semibold text-slate-100">{liveCalls}</p>
                <p>Live</p>
              </div>
            </div>
          </div>
        </WidgetCard>
      )
    }
  ];
}

function LiveSummary({
  liveCalls,
  totalCalls,
  completedCalls
}: {
  liveCalls: number;
  totalCalls: number;
  completedCalls: number;
}) {
  return (
    <div className="space-y-4">
      <div className="text-5xl font-semibold text-slate-100">
        {liveCalls}
        <span className="text-base text-slate-500"> / {totalCalls}</span>
      </div>
      <p className="text-xs text-slate-400">
        Forwarded versus total calls. Keep an eye on concurrency caps as the window
        updates.
      </p>
      <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
        <div className="rounded-lg border border-slate-900 bg-slate-950/60 p-3">
          <p className="text-slate-200">Completed</p>
          <p className="text-2xl font-semibold text-slate-100">{completedCalls}</p>
        </div>
        <div className="rounded-lg border border-slate-900 bg-slate-950/60 p-3">
          <p className="text-slate-200">Queued</p>
          <p className="text-2xl font-semibold text-slate-100">
            {Math.max(totalCalls - completedCalls, 0)}
          </p>
        </div>
      </div>
    </div>
  );
}