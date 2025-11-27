import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type Integration = {
  id: string;
  name: string;
  category: string;
  status: string;
  connected: boolean;
  lastSyncAt?: string | null;
  description?: string | null;
};

async function getData(): Promise<DashboardResponse> {
  const integrations = await apiFetch<Integration[]>('/api/integrations');
  return {
    title: 'Integrations Catalog',
    description: 'Connected systems and their sync state.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Connected',
        value: integrations.filter((integration) => integration.connected).length.toString(),
        helper: `${integrations.length} total`,
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'integrations-table',
        title: 'Integrations',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'category', label: 'Category' },
          { key: 'status', label: 'Status' },
          { key: 'lastSync', label: 'Last Sync' }
        ],
        rows: integrations.map((integration) => ({
          id: integration.id,
          name: integration.name,
          category: integration.category,
          status: integration.status,
          lastSync: integration.lastSyncAt
            ? new Date(integration.lastSyncAt).toLocaleString()
            : '—'
        }))
      }
    ]
  };
}

export default async function IntegrationsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
