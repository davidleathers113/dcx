import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type Provider = {
  id: string;
  type: string;
  label: string;
  status: string;
  lastHeartbeatAt?: string | null;
  region?: string | null;
  capacityShare: number;
};

async function getData(): Promise<DashboardResponse> {
  const providers = await apiFetch<Provider[]>('/api/providers');
  return {
    title: 'Carrier Providers',
    description: 'Twilio / Telnyx status with failover shares.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Providers',
        value: providers.length.toString(),
        helper: 'Configured carriers',
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'providers-table',
        title: 'Providers',
        columns: [
          { key: 'label', label: 'Label' },
          { key: 'type', label: 'Type' },
          { key: 'status', label: 'Status' },
          { key: 'share', label: 'Capacity', align: 'right' }
        ],
        rows: providers.map((provider) => ({
          id: provider.id,
          label: provider.label,
          type: provider.type,
          status: provider.status,
          share: `${provider.capacityShare}%`
        }))
      }
    ]
  };
}

export default async function ProvidersPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
