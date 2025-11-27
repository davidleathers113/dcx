import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type SmsMessage = {
  id: string;
  direction: string;
  phone: string;
  status: string;
  body: string;
  lead?: string | null;
  occurredAt: string;
};

async function getData(): Promise<DashboardResponse> {
  const messages = await apiFetch<SmsMessage[]>('/api/sms/messages?direction=OUTBOUND');
  return {
    title: 'Outgoing SMS',
    description: 'Recent outbound notifications and nurture messages.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Messages',
        value: messages.length.toString(),
        helper: 'Last 100 sends',
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'outgoing-sms',
        title: 'Messages',
        columns: [
          { key: 'time', label: 'Time' },
          { key: 'phone', label: 'Phone' },
          { key: 'status', label: 'Status' },
          { key: 'body', label: 'Body' }
        ],
        rows: messages.map((msg) => ({
          id: msg.id,
          time: new Date(msg.occurredAt).toLocaleString(),
          phone: msg.phone,
          status: msg.status,
          body: msg.body
        }))
      }
    ]
  };
}

export default async function SmsOutgoingPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
