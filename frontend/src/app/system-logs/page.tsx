import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type SystemLog = {
  id: string;
  component: string;
  severity: string;
  message: string;
  traceId?: string | null;
  callSessionId?: string | null;
  createdAt: string;
};

async function getData(): Promise<DashboardResponse> {
  const logs = await apiFetch<SystemLog[]>('/api/system-logs');
  const severityCounts = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.severity] = (acc[log.severity] ?? 0) + 1;
    return acc;
  }, {});

  return {
    title: 'System Logs',
    description: 'Operational trail of the DCX backend components.',
    generatedAt: new Date().toISOString(),
    stats: Object.entries(severityCounts).map(([severity, count]) => ({
      label: severity,
      value: count.toString(),
      helper: 'last 50 entries',
      accent: severity === 'ERROR' ? 'rose' : 'emerald'
    })),
    tables: [
      {
        id: 'system-log-table',
        title: 'Recent Events',
        columns: [
          { key: 'time', label: 'Time' },
          { key: 'component', label: 'Component' },
          { key: 'severity', label: 'Severity' },
          { key: 'message', label: 'Message' }
        ],
        rows: logs.map((log) => ({
          id: log.id,
          time: new Date(log.createdAt).toLocaleString(),
          component: log.component,
          severity: log.severity,
          message: log.message
        }))
      }
    ]
  };
}

export default async function SystemLogsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
