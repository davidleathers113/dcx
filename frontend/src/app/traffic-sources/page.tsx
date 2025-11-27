import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type TrafficSource = {
  id: string;
  name: string;
  channel: string;
  supplier: string;
  status: string;
  cplCents?: number | null;
  calls: number;
};

const formatMoney = (cents?: number | null) => (cents != null ? `$${(cents / 100).toFixed(2)}` : '—');

async function getData(): Promise<DashboardResponse> {
  const sources = await apiFetch<TrafficSource[]>('/api/traffic-sources');
  return {
    title: 'Traffic Sources',
    description: 'Publisher + channel performance snapshots.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Sources',
        value: sources.length.toString(),
        helper: `${sources.reduce((sum, source) => sum + source.calls, 0)} calls`,
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'traffic-sources-table',
        title: 'Sources',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'channel', label: 'Channel' },
          { key: 'calls', label: 'Calls', align: 'right' },
          { key: 'cpl', label: 'CPL', align: 'right' }
        ],
        rows: sources.map((source) => ({
          id: source.id,
          name: source.name,
          channel: source.channel,
          calls: source.calls.toString(),
          cpl: formatMoney(source.cplCents)
        }))
      }
    ]
  };
}

export default async function TrafficSourcesPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
