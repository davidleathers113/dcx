import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type WebhookLog = {
  id: string;
  direction: string;
  event: string;
  url: string;
  statusCode: number;
  latencyMs: number;
  traceId?: string | null;
  createdAt: string;
};

async function getData(): Promise<DashboardResponse> {
  const logs = await apiFetch<WebhookLog[]>('/api/webhook-logs');
  const failures = logs.filter((log) => log.statusCode >= 400).length;

  return {
    title: 'Webhook Delivery Logs',
    description: 'Outbound + inbound webhook telemetry with latency details.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Events',
        value: logs.length.toString(),
        helper: 'Last 50 entries',
        accent: 'emerald'
      },
      {
        label: 'Failures',
        value: failures.toString(),
        helper: 'status >= 400',
        accent: failures ? 'rose' : 'emerald'
      }
    ],
    tables: [
      {
        id: 'webhook-log-table',
        title: 'Recent Deliveries',
        columns: [
          { key: 'time', label: 'Time' },
          { key: 'event', label: 'Event' },
          { key: 'direction', label: 'Direction' },
          { key: 'url', label: 'URL' },
          { key: 'status', label: 'Status', align: 'right' }
        ],
        rows: logs.map((log) => ({
          id: log.id,
          time: new Date(log.createdAt).toLocaleString(),
          event: log.event,
          direction: log.direction,
          url: log.url,
          status: `${log.statusCode} · ${log.latencyMs} ms`
        }))
      }
    ]
  };
}

export default async function WebhookLogsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
