import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type LeadReport = {
  totals: {
    totalLeads: number;
    qualified: number;
    events: number;
  };
  campaigns: Array<{
    campaign: string;
    total: number;
    qualified: number;
  }>;
};

async function getData(): Promise<DashboardResponse> {
  const report = await apiFetch<LeadReport>('/api/leads/report');
  return {
    title: 'Lead Performance',
    description: 'Conversion health by campaign.',
    generatedAt: new Date().toISOString(),
    stats: [
      { label: 'Total Leads', value: report.totals.totalLeads.toString(), accent: 'emerald' },
      { label: 'Qualified', value: report.totals.qualified.toString(), accent: 'sky' },
      { label: 'Events', value: report.totals.events.toString(), accent: 'amber' }
    ],
    tables: [
      {
        id: 'lead-report-table',
        title: 'By Campaign',
        columns: [
          { key: 'campaign', label: 'Campaign' },
          { key: 'total', label: 'Total', align: 'right' },
          { key: 'qualified', label: 'Qualified', align: 'right' }
        ],
        rows: report.campaigns.map((campaign) => ({
          id: campaign.campaign,
          campaign: campaign.campaign,
          total: campaign.total.toString(),
          qualified: campaign.qualified.toString()
        }))
      }
    ]
  };
}

export default async function LeadsReportPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
