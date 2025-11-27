import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

async function getData(): Promise<DashboardResponse> {
  return apiFetch<DashboardResponse>('/api/performance/routing');
}

export default async function RoutingHealthPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
