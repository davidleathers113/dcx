import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type TeamMember = {
  id: string;
  name: string;
  role: string;
  email?: string | null;
  teamId?: string | null;
  lastSeenAt?: string | null;
};

async function getData(): Promise<DashboardResponse> {
  const members = await apiFetch<TeamMember[]>('/api/team-members');
  return {
    title: 'Team Members',
    description: 'On-call roster for the platform team.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Members',
        value: members.length.toString(),
        helper: 'Active roster',
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'members-table',
        title: 'Roster',
        columns: [
          { key: 'name', label: 'Name' },
          { key: 'role', label: 'Role' },
          { key: 'email', label: 'Email' },
          { key: 'lastSeen', label: 'Last Seen' }
        ],
        rows: members.map((member) => ({
          id: member.id,
          name: member.name,
          role: member.role,
          email: member.email ?? '—',
          lastSeen: member.lastSeenAt ? new Date(member.lastSeenAt).toLocaleString() : '—'
        }))
      }
    ]
  };
}

export default async function TeamMembersPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
