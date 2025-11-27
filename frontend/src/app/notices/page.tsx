import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type Notice = {
  id: string;
  title: string;
  body: string;
  category: string;
  effectiveAt: string;
  expiresAt?: string | null;
  attachmentUrl?: string | null;
};

async function getData(): Promise<DashboardResponse> {
  const notices = await apiFetch<Notice[]>('/api/notices');
  return {
    title: 'Operational Notices',
    description: 'Maintenance windows and compliance reminders.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Active Notices',
        value: notices.length.toString(),
        helper: 'Includes carrier + compliance updates',
        accent: 'sky'
      }
    ],
    timeline: notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      status: notice.category,
      date: new Date(notice.effectiveAt).toLocaleDateString(),
      description: notice.body,
      meta: notice.attachmentUrl ?? undefined
    })),
    tables: [
      {
        id: 'notices-table',
        title: 'Notices',
        columns: [
          { key: 'title', label: 'Title' },
          { key: 'category', label: 'Category' },
          { key: 'effective', label: 'Effective' }
        ],
        rows: notices.map((notice) => ({
          id: notice.id,
          title: notice.title,
          category: notice.category,
          effective: new Date(notice.effectiveAt).toLocaleString()
        }))
      }
    ]
  };
}

export default async function NoticesPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
