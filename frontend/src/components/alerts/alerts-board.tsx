'use client';

import { useTransition } from 'react';
import { apiMutate } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type AlertSource = {
  id: string;
  title: string;
  description?: string | null;
  severity: string;
  status: string;
  openedAt: string;
  slaMinutes?: number | null;
  ackedAt?: string | null;
  ackedBy?: string | null;
};

type AlertStats = {
  open: number;
  critical: number;
  acknowledged: number;
};

type AlertsBoardProps = {
  stats: AlertStats;
  active: AlertSource[];
  resolved: AlertSource[];
  refresh?: () => void;
};

export function AlertsBoard({ stats, active, resolved }: AlertsBoardProps) {
  const [pending, startTransition] = useTransition();

  const acknowledge = (id: string) => {
    startTransition(async () => {
      await apiMutate(`/api/alerts/${id}/ack`, { method: 'PATCH' });
      // Force reload after ack to show updated data
      window.location.reload();
    });
  };

  const renderAlert = (alert: AlertSource) => (
    <div
      key={alert.id}
      className="rounded-xl border border-slate-900 bg-slate-950/40 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">{alert.title}</p>
          {alert.description ? (
            <p className="text-xs text-slate-400">{alert.description}</p>
          ) : null}
          <p className="text-[11px] text-slate-500">
            Opened {new Date(alert.openedAt).toLocaleString()}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            alert.severity === 'CRITICAL'
              ? 'border-rose-500/50 text-rose-300'
              : 'border-amber-500/30 text-amber-200'
          }
        >
          {alert.severity}
        </Badge>
      </div>
      {alert.status !== 'RESOLVED' ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            SLA: {alert.slaMinutes ?? '—'} min | {alert.status}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            disabled={pending}
            onClick={() => acknowledge(alert.id)}
          >
            Acknowledge
          </Button>
        </div>
      ) : null}
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Platform Alerts</h1>
          <p className="text-sm text-slate-400">
            Routing, carrier, and security incidents that require attention.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-500">Open</p>
            <p className="text-3xl font-semibold text-slate-50">{stats.open}</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-500">Critical</p>
            <p className="text-3xl font-semibold text-rose-200">{stats.critical}</p>
          </div>
          <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-4">
            <p className="text-xs text-slate-500">Acknowledged</p>
            <p className="text-3xl font-semibold text-amber-200">{stats.acknowledged}</p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Active
          </h2>
          {active.length ? active.map(renderAlert) : (
            <p className="text-xs text-slate-500">No active alerts 🎉</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Recently Resolved
          </h2>
          {resolved.length ? resolved.map(renderAlert) : (
            <p className="text-xs text-slate-500">No resolved alerts yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
