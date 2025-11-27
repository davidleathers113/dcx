import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type RingPool = {
  id: string;
  label: string;
  campaign: string;
  supplier: string;
  mode: string;
  targetSize: number;
  healthyCount: number;
  assignedNumbers: string[];
};

async function getData(): Promise<DashboardResponse> {
  const pools = await apiFetch<RingPool[]>('/api/ring-pools');
  return {
    title: 'Ring Pools',
    description: 'Number pools mapped to campaigns and suppliers.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Pools',
        value: pools.length.toString(),
        helper: `${pools.reduce((sum, pool) => sum + pool.targetSize, 0)} target DIDs`,
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'ring-pools-table',
        title: 'Pools',
        columns: [
          { key: 'label', label: 'Pool' },
          { key: 'campaign', label: 'Campaign' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'health', label: 'Health', align: 'right' }
        ],
        rows: pools.map((pool) => ({
          id: pool.id,
          label: pool.label,
          campaign: pool.campaign,
          supplier: pool.supplier,
          health: `${pool.healthyCount}/${pool.targetSize}`
        }))
      }
    ]
  };
}

export default async function RingPoolsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
