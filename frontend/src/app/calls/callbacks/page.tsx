import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type CallbackRequest = {
  id: string;
  status: string;
  priority: number;
  assignedTo?: string | null;
  notes?: string | null;
  dueAt?: string | null;
  callId?: string | null;
};

async function getData(): Promise<DashboardResponse> {
  const callbacks = await apiFetch<CallbackRequest[]>('/api/calls/callbacks');
  return {
    title: 'Callback Queue',
    description: 'Calls that require manual follow-up.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Open Requests',
        value: callbacks.length.toString(),
        helper: 'Sorted by priority',
        accent: 'amber'
      }
    ],
    tables: [
      {
        id: 'callbacks-table',
        title: 'Queue',
        columns: [
          { key: 'call', label: 'Call' },
          { key: 'status', label: 'Status' },
          { key: 'owner', label: 'Owner' },
          { key: 'due', label: 'Due' }
        ],
        rows: callbacks.map((cb) => ({
          id: cb.id,
          call: cb.callId ?? '—',
          status: cb.status,
          owner: cb.assignedTo ?? 'Unassigned',
          due: cb.dueAt ? new Date(cb.dueAt).toLocaleString() : '—'
        }))
      }
    ]
  };
}

export default async function CallbackRequestsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
