import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type BillingPayment = {
  id: string;
  amountCents: number;
  method: string;
  reference?: string | null;
  status: string;
  receivedAt: string;
};

const formatMoney = (cents: number) => `$${(cents / 100).toFixed(2)}`;

async function getData(): Promise<DashboardResponse> {
  const payments = await apiFetch<BillingPayment[]>('/api/billing/payments');
  const received = payments.reduce((sum, payment) => sum + payment.amountCents, 0);

  return {
    title: 'Billing Payments',
    description: 'Settlement timeline for carrier invoices.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Received',
        value: formatMoney(received),
        helper: 'All recorded payments',
        accent: 'emerald'
      }
    ],
    tables: [
      {
        id: 'payments-table',
        title: 'Payments',
        columns: [
          { key: 'date', label: 'Date' },
          { key: 'amount', label: 'Amount', align: 'right' },
          { key: 'method', label: 'Method' },
          { key: 'status', label: 'Status' }
        ],
        rows: payments.map((payment) => ({
          id: payment.id,
          date: new Date(payment.receivedAt).toLocaleDateString(),
          amount: formatMoney(payment.amountCents),
          method: payment.method,
          status: payment.status
        }))
      }
    ]
  };
}

export default async function BillingPaymentsPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
