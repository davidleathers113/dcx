import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type SmsSummary = {
  totals: {
    sent: number;
    received: number;
    blasts: number;
    optOuts: number;
    registrations: number;
  };
};

async function getData(): Promise<DashboardResponse> {
  const summary = await apiFetch<SmsSummary>('/api/sms');
  return {
    title: 'Messaging Overview',
    description: 'SMS outreach volume and compliance posture.',
    generatedAt: new Date().toISOString(),
    stats: [
      { label: 'Sent', value: summary.totals.sent.toString(), accent: 'emerald' },
      { label: 'Received', value: summary.totals.received.toString(), accent: 'sky' },
      { label: 'Opt-outs', value: summary.totals.optOuts.toString(), accent: 'rose' }
    ],
    sections: [
      {
        id: 'compliance',
        title: 'Registration Health',
        body: `${summary.totals.registrations} registrations synced with carriers.`
      }
    ]
  };
}

export default async function SmsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
