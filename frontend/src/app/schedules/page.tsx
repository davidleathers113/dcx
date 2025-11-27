import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type ScheduleRule = {
  id: string;
  targetType: string;
  targetId: string;
  timezone: string;
  daysOfWeek: number[];
  startMinutes: number;
  endMinutes: number;
  status: string;
};

function minutesToLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

async function getData(): Promise<DashboardResponse> {
  const rules = await apiFetch<ScheduleRule[]>('/api/schedules');
  return {
    title: 'Scheduling Rules',
    description: 'Buyer + campaign availability windows.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Active Rules',
        value: rules.filter((rule) => rule.status === 'ACTIVE').length.toString(),
        helper: `${rules.length} total`,
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'schedule-table',
        title: 'Rules',
        columns: [
          { key: 'target', label: 'Target' },
          { key: 'window', label: 'Window' },
          { key: 'timezone', label: 'Timezone' },
          { key: 'status', label: 'Status' }
        ],
        rows: rules.map((rule) => ({
          id: rule.id,
          target: `${rule.targetType} ${rule.targetId}`,
          window: `${minutesToLabel(rule.startMinutes)} - ${minutesToLabel(rule.endMinutes)}`,
          timezone: rule.timezone,
          status: rule.status
        }))
      }
    ]
  };
}

export default async function SchedulesPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
