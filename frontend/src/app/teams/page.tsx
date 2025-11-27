import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type Team = {
  id: string;
  name: string;
  purpose?: string | null;
  pagerNumber?: string | null;
  onCallContact?: string | null;
  members: Array<{
    id: string;
    name: string;
    role: string;
    email?: string | null;
    lastSeenAt?: string | null;
  }>;
  openAlerts: number;
};

async function getData(): Promise<DashboardResponse> {
  const teams = await apiFetch<Team[]>('/api/teams');
  return {
    title: 'Teams & On-call',
    description: 'Ownership map for routing, security, and compliance workstreams.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Teams',
        value: teams.length.toString(),
        helper: `${teams.reduce((sum, team) => sum + team.members.length, 0)} members`,
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'teams-table',
        title: 'Teams',
        columns: [
          { key: 'team', label: 'Team' },
          { key: 'purpose', label: 'Purpose' },
          { key: 'members', label: 'Members', align: 'right' },
          { key: 'alerts', label: 'Open Alerts', align: 'right' }
        ],
        rows: teams.map((team) => ({
          id: team.id,
          team: team.name,
          purpose: team.purpose ?? '—',
          members: team.members.length.toString(),
          alerts: team.openAlerts.toString()
        }))
      }
    ]
  };
}

export default async function TeamsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
