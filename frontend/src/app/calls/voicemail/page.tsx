import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type Voicemail = {
  id: string;
  status: string;
  recordingUrl: string;
  transcription?: string | null;
  assignedTo?: string | null;
  receivedAt: string;
  callId?: string | null;
};

async function getData(): Promise<DashboardResponse> {
  const voicemails = await apiFetch<Voicemail[]>('/api/calls/voicemails');
  return {
    title: 'Voicemails',
    description: 'Transcriptions and ownership for return calls.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Awaiting Review',
        value: voicemails.filter((vm) => vm.status !== 'ARCHIVED').length.toString(),
        helper: `${voicemails.length} total`,
        accent: 'amber'
      }
    ],
    tables: [
      {
        id: 'voicemails-table',
        title: 'Voicemails',
        columns: [
          { key: 'time', label: 'Received' },
          { key: 'call', label: 'Call' },
          { key: 'status', label: 'Status' },
          { key: 'owner', label: 'Owner' }
        ],
        rows: voicemails.map((vm) => ({
          id: vm.id,
          time: new Date(vm.receivedAt).toLocaleString(),
          call: vm.callId ?? '—',
          status: vm.status,
          owner: vm.assignedTo ?? 'Unassigned'
        }))
      }
    ]
  };
}

export default async function VoicemailPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
