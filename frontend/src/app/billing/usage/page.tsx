import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type UsageResponse = {
  voiceMinutes: number;
  voiceCostCents: number;
  sms: {
    outgoing: number;
    incoming: number;
  };
  generatedAt: string;
};

const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

async function getData(): Promise<DashboardResponse> {
  const usage = await apiFetch<UsageResponse>('/api/billing/usage');
  return {
    title: 'Usage & Cost',
    description: 'Blended carrier usage for voice + SMS channels.',
    generatedAt: usage.generatedAt,
    stats: [
      {
        label: 'Voice Minutes',
        value: usage.voiceMinutes.toString(),
        helper: 'Billable minutes',
        accent: 'emerald'
      },
      {
        label: 'Voice Cost',
        value: formatMoney(usage.voiceCostCents),
        helper: 'Carrier fees',
        accent: 'rose'
      }
    ],
    charts: [
      {
        id: 'sms-usage',
        title: 'SMS Segments',
        type: 'bar',
        data: [
          { label: 'Outgoing', value: usage.sms.outgoing },
          { label: 'Incoming', value: usage.sms.incoming }
        ]
      }
    ],
    sections: [
      {
        id: 'note',
        title: 'Monitoring',
        body: 'Review per-channel costs weekly and adjust buyer payouts as needed.'
      }
    ]
  };
}

export default async function BillingUsagePage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
