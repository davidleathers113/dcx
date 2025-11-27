import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type BillingStatement = {
  id: string;
  periodStart: string;
  periodEnd: string;
  totalCostCents: number;
  paymentsAppliedCents: number;
  balanceCents: number;
  pdfUrl?: string | null;
  status: string;
};

const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

async function getData(): Promise<DashboardResponse> {
  const statements = await apiFetch<BillingStatement[]>('/api/billing/statements');
  const balance = statements.reduce((sum, stmt) => sum + stmt.balanceCents, 0);

  return {
    title: 'Billing Statements',
    description: 'Carrier cost versus payouts with download links.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Outstanding',
        value: formatMoney(balance),
        helper: `${statements.length} statements`,
        accent: balance > 0 ? 'rose' : 'emerald'
      }
    ],
    tables: [
      {
        id: 'statements-table',
        title: 'Statements',
        columns: [
          { key: 'period', label: 'Period' },
          { key: 'total', label: 'Cost', align: 'right' },
          { key: 'paid', label: 'Payments', align: 'right' },
          { key: 'balance', label: 'Balance', align: 'right' },
          { key: 'status', label: 'Status' }
        ],
        rows: statements.map((stmt) => ({
          id: stmt.id,
          period: `${new Date(stmt.periodStart).toLocaleDateString()} – ${new Date(
            stmt.periodEnd
          ).toLocaleDateString()}`,
          total: formatMoney(stmt.totalCostCents),
          paid: formatMoney(stmt.paymentsAppliedCents),
          balance: formatMoney(stmt.balanceCents),
          status: stmt.status
        }))
      }
    ]
  };
}

export default async function BillingStatementsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
