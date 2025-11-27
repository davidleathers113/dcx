import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type PlatformMigration = {
  id: string;
  sourceSystem: string;
  targetSystem: string;
  owner: string;
  phase: string;
  risk: string;
  cutoverDate: string;
  summary?: string | null;
};

async function getData(): Promise<DashboardResponse> {
  const migrations = await apiFetch<PlatformMigration[]>('/api/platform-migrations');
  const inFlight = migrations.filter((mig) => mig.phase !== 'COMPLETE');
  const completed = migrations.length - inFlight.length;

  return {
    title: 'Platform Migrations',
    description: 'TrackDrive → DCX cutover roadmap with risk and ownership.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Active Streams',
        value: inFlight.length.toString(),
        helper: `${completed} completed`,
        accent: 'emerald'
      },
      {
        label: 'High Risk',
        value: migrations.filter((mig) => mig.risk === 'HIGH').length.toString(),
        helper: 'Requires exec attention',
        accent: 'rose'
      }
    ],
    timeline: migrations.map((mig) => ({
      id: mig.id,
      title: `${mig.sourceSystem} → ${mig.targetSystem}`,
      status: mig.phase,
      date: new Date(mig.cutoverDate).toLocaleDateString(),
      description: mig.summary ?? 'No summary'
    })),
    tables: [
      {
        id: 'migrations-table',
        title: 'Workstreams',
        columns: [
          { key: 'name', label: 'Track' },
          { key: 'owner', label: 'Owner' },
          { key: 'phase', label: 'Phase' },
          { key: 'risk', label: 'Risk' }
        ],
        rows: migrations.map((mig) => ({
          id: mig.id,
          name: `${mig.sourceSystem} → ${mig.targetSystem}`,
          owner: mig.owner,
          phase: mig.phase,
          risk: mig.risk
        }))
      }
    ]
  };
}

export default async function PlatformMigrationsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
