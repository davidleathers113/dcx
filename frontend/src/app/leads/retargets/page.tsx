import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type RetargetList = {
  id: string;
  name: string;
  campaign: string;
  size: number;
  healthScore: number;
  lastPushAt?: string | null;
  status: string;
};

async function getData(): Promise<DashboardResponse> {
  const lists = await apiFetch<RetargetList[]>('/api/leads/retargets');
  return {
    title: 'Retarget Lists',
    description: 'Audience pools for re-engagement pushes.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Lists',
        value: lists.length.toString(),
        helper: 'Across all campaigns',
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'retarget-table',
        title: 'Lists',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'campaign', label: 'Campaign' },
          { key: 'size', label: 'Size', align: 'right' },
          { key: 'status', label: 'Status' }
        ],
        rows: lists.map((list) => ({
          id: list.id,
          name: list.name,
          campaign: list.campaign,
          size: list.size.toString(),
          status: list.status
        }))
      }
    ]
  };
}

export default async function RetargetsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
