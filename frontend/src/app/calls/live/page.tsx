import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type LiveCall = {
  id: string;
  status: string;
  from: string;
  to: string;
  campaign: string;
  buyer: string;
  startedAt: string;
};

async function getData(): Promise<DashboardResponse> {
  const calls = await apiFetch<LiveCall[]>('/api/calls/live');
  return {
    title: 'Live Calls',
    description: 'In-progress calls with routing context.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Live Calls',
        value: calls.length.toString(),
        helper: 'Updated on refresh',
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'live-calls',
        title: 'Calls',
        columns: [
          { key: 'started', label: 'Started' },
          { key: 'from', label: 'Caller' },
          { key: 'campaign', label: 'Campaign' },
          { key: 'buyer', label: 'Buyer' }
        ],
        rows: calls.map((call) => ({
          id: call.id,
          started: new Date(call.startedAt).toLocaleTimeString(),
          from: call.from,
          campaign: call.campaign,
          buyer: call.buyer
        }))
      }
    ]
  };
}

export default async function LiveCallsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
