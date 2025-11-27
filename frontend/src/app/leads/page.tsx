import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type Lead = {
  id: string;
  name: string;
  stage: string;
  phone?: string | null;
  source?: string | null;
  campaign: string;
  score?: number | null;
  createdAt: string;
};

async function getData(): Promise<DashboardResponse> {
  const leads = await apiFetch<Lead[]>('/api/leads');
  const stageCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    acc[lead.stage] = (acc[lead.stage] ?? 0) + 1;
    return acc;
  }, {});

  return {
    title: 'Lead Workspace',
    description: 'Latest inbound leads with stage distribution.',
    generatedAt: new Date().toISOString(),
    stats: Object.entries(stageCounts).map(([stage, count]) => ({
      label: stage,
      value: count.toString(),
      helper: 'Current stage counts',
      accent: stage === 'QUALIFIED' ? 'emerald' : 'slate'
    })),
    tables: [
      {
        id: 'leads-table',
        title: 'Leads',
        columns: [
          { key: 'name', label: 'Lead' },
          { key: 'stage', label: 'Stage' },
          { key: 'source', label: 'Source' },
          { key: 'campaign', label: 'Campaign' }
        ],
        rows: leads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          stage: lead.stage,
          source: lead.source ?? '—',
          campaign: lead.campaign
        }))
      }
    ]
  };
}

export default async function LeadsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
