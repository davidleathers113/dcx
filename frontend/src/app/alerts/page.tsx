import { AlertsBoard } from '@/components/alerts/alerts-board';
import { apiFetch } from '@/lib/api';

type AlertsResponse = {
  stats: {
    open: number;
    critical: number;
    acknowledged: number;
  };
  active: Array<{
    id: string;
    title: string;
    description?: string | null;
    severity: string;
    status: string;
    openedAt: string;
    slaMinutes?: number | null;
    ackedAt?: string | null;
    ackedBy?: string | null;
  }>;
  resolved: Array<{
    id: string;
    title: string;
    description?: string | null;
    severity: string;
    status: string;
    openedAt: string;
    slaMinutes?: number | null;
    ackedAt?: string | null;
    ackedBy?: string | null;
    resolvedAt?: string | null;
  }>;
};

async function getAlerts(): Promise<AlertsResponse> {
  return apiFetch<AlertsResponse>('/api/alerts');
}

export default async function AlertsPage() {
  const data = await getAlerts();
  return <AlertsBoard {...data} />;
}
