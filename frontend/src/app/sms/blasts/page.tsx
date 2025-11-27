import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type SmsBlast = {
  id: string;
  name: string;
  status: string;
  audienceSize: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: string | null;
  template: string;
};

async function getData(): Promise<DashboardResponse> {
  const blasts = await apiFetch<SmsBlast[]>('/api/sms/blasts');
  return {
    title: 'SMS Blasts',
    description: 'Campaign-scale SMS pushes and their delivery stats.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Active Blasts',
        value: blasts.filter((blast) => blast.status !== 'COMPLETED').length.toString(),
        helper: `${blasts.length} total`,
        accent: 'amber'
      }
    ],
    tables: [
      {
        id: 'blasts-table',
        title: 'Blasts',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status' },
          { key: 'progress', label: 'Progress', align: 'right' }
        ],
        rows: blasts.map((blast) => ({
          id: blast.id,
          name: blast.name,
          status: blast.status,
          progress: `${blast.sentCount}/${blast.audienceSize}`
        }))
      }
    ]
  };
}

export default async function SmsBlastsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
