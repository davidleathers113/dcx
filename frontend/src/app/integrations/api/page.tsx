import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type ApiKey = {
  id: string;
  label: string;
  tokenPreview: string;
  scopes: string[];
  lastUsedAt?: string | null;
  status: string;
  expiresAt?: string | null;
};

async function getData(): Promise<DashboardResponse> {
  const keys = await apiFetch<ApiKey[]>('/api/integrations/api-keys');
  return {
    title: 'Admin API Keys',
    description: 'Scopes, rotation schedule, and last usage.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Keys',
        value: keys.length.toString(),
        helper: `${keys.filter((key) => key.status === 'ACTIVE').length} active`,
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'api-keys-table',
        title: 'Keys',
        columns: [
          { key: 'label', label: 'Label' },
          { key: 'preview', label: 'Preview' },
          { key: 'scopes', label: 'Scopes' },
          { key: 'lastUsed', label: 'Last Used' },
          { key: 'status', label: 'Status' }
        ],
        rows: keys.map((key) => ({
          id: key.id,
          label: key.label,
          preview: key.tokenPreview,
          scopes: key.scopes.join(', '),
          lastUsed: key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : '—',
          status: key.status
        }))
      }
    ]
  };
}

export default async function ApiIntegrationsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
