'use client';

import { useTransition } from 'react';
import { apiMutate } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export type WebhookSubscription = {
  id: string;
  event: string;
  url: string;
  status: string;
  failureCount: number;
  lastDeliveredAt?: string | null;
  avgLatencyMs?: number | null;
};

type Props = {
  webhooks: WebhookSubscription[];
};

export function WebhookTable({ webhooks }: Props) {
  const [pending, startTransition] = useTransition();

  const triggerTest = (id: string) => {
    startTransition(async () => {
      await apiMutate(`/api/webhooks/${id}/test`, { method: 'POST' });
      window.location.reload();
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-950/40">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900/50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Event</th>
            <th className="px-4 py-3">URL</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Latency</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {webhooks.map((hook) => (
            <tr key={hook.id} className="border-t border-slate-900">
              <td className="px-4 py-3 text-slate-100">{hook.event}</td>
              <td className="px-4 py-3 text-xs text-slate-400">{hook.url}</td>
              <td className="px-4 py-3">
                <Badge
                  variant="outline"
                  className={
                    hook.status === 'ACTIVE'
                      ? 'border-emerald-500/40 text-emerald-300'
                      : 'border-slate-800 text-slate-400'
                  }
                >
                  {hook.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">
                {hook.avgLatencyMs ? `${hook.avgLatencyMs} ms` : '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => triggerTest(hook.id)}
                  className="text-xs"
                >
                  Test Delivery
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
