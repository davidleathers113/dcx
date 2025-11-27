import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type SecretItem = {
  id: string;
  label: string;
  scope: string;
  owner: string;
  rotationDueAt: string;
  maskedValue: string;
  notes?: string | null;
};

async function getData(): Promise<DashboardResponse> {
  const secrets = await apiFetch<SecretItem[]>('/api/secret-items');
  const overdue = secrets.filter(
    (secret) => new Date(secret.rotationDueAt).getTime() < Date.now()
  ).length;

  return {
    title: 'Secret Inventory',
    description: 'Vault references and rotation health.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Secrets',
        value: secrets.length.toString(),
        helper: `${overdue} overdue rotations`,
        accent: overdue ? 'rose' : 'emerald'
      }
    ],
    tables: [
      {
        id: 'secrets-table',
        title: 'Secrets',
        columns: [
          { key: 'label', label: 'Label' },
          { key: 'scope', label: 'Scope' },
          { key: 'owner', label: 'Owner' },
          { key: 'rotation', label: 'Rotation Due' }
        ],
        rows: secrets.map((secret) => ({
          id: secret.id,
          label: secret.label,
          scope: secret.scope,
          owner: secret.owner,
          rotation: new Date(secret.rotationDueAt).toLocaleDateString()
        }))
      }
    ]
  };
}

export default async function SecretItemsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
