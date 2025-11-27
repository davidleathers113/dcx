import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type ImportJob = {
  id: string;
  source: string;
  campaignId?: string | null;
  status: string;
  rowsTotal: number;
  rowsImported: number;
  errorCount: number;
  createdAt: string;
};

async function getData(): Promise<DashboardResponse> {
  const jobs = await apiFetch<ImportJob[]>('/api/leads/imports');
  return {
    title: 'Lead Imports',
    description: 'CSV + automation imports with status tracking.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Jobs',
        value: jobs.length.toString(),
        helper: 'Recent imports',
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'imports-table',
        title: 'Import Jobs',
        columns: [
          { key: 'source', label: 'Source' },
          { key: 'status', label: 'Status' },
          { key: 'rows', label: 'Rows', align: 'right' },
          { key: 'errors', label: 'Errors', align: 'right' }
        ],
        rows: jobs.map((job) => ({
          id: job.id,
          source: job.source,
          status: job.status,
          rows: `${job.rowsImported}/${job.rowsTotal}`,
          errors: job.errorCount.toString()
        }))
      }
    ]
  };
}

export default async function LeadImportsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
