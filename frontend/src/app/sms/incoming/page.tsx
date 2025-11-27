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
  const messages = await apiFetch<SmsMessage[]>('/api/sms/messages?direction=INBOUND');
  return {
    title: 'Incoming SMS',
    description: 'Two-way engagement monitoring.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Messages',
        value: messages.length.toString(),
        helper: 'Last 100 replies',
        accent: 'sky'
      }
    ],
    tables: [
      {
        id: 'incoming-sms',
        title: 'Messages',
        columns: [
          { key: 'time', label: 'Time' },
          { key: 'phone', label: 'Phone' },
          { key: 'body', label: 'Body' }
        ],
        rows: messages.map((msg) => ({
          id: msg.id,
          time: new Date(msg.occurredAt).toLocaleString(),
          phone: msg.phone,
          body: msg.body
        }))
      }
    ]
  };
}

export default async function SmsIncomingPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
