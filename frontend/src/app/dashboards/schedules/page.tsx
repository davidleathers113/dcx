import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type ScheduleDashboard = {
  buyersOnline: number;
  buyerTotal: number;
  adherence: number;
  blackoutRules: number;
};

async function getData(): Promise<DashboardResponse> {
  const dashboard = await apiFetch<ScheduleDashboard>('/api/dashboards/schedules');
  return {
    title: 'Schedule Adherence',
    description: 'Buyer availability compared to expected staffing.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Buyers Online',
        value: `${dashboard.buyersOnline}/${dashboard.buyerTotal}`,
        helper: 'Active vs expected',
        accent: dashboard.adherence > 90 ? 'emerald' : 'rose'
      },
      {
        label: 'Adherence',
        value: `${dashboard.adherence}%`,
        helper: 'Within SLA',
        accent: dashboard.adherence > 90 ? 'emerald' : 'amber'
      }
    ],
    sections: [
      {
        id: 'blackouts',
        title: 'Blackout Rules',
        body: `${dashboard.blackoutRules} rules currently disable routing for time-of-day or maintenance.`
      }
    ]
  };
}

export default async function SchedulesDashboardPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
