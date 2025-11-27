import { ResourceDashboard } from '@/components/dashboard/resource-dashboard';
import { apiFetch } from '@/lib/api';
import type { DashboardResponse } from '@/types/dashboard';

type CarrierRate = {
  id: string;
  carrier: string;
  countryCode: string;
  prefix: string;
  voiceInboundRateMicro: number;
  voiceOutboundRateMicro: number;
  smsRateMicro: number;
};

const formatRate = (micro: number) => `$${(micro / 1_000_000).toFixed(4)}`;

async function getData(): Promise<DashboardResponse> {
  const rates = await apiFetch<CarrierRate[]>('/api/billing/rates');
  return {
    title: 'Carrier Rate Cards',
    description: 'Voice + SMS pricing pulled from provider references.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Carriers',
        value: new Set(rates.map((rate) => rate.carrier)).size.toString(),
        helper: 'Distinct vendors',
        accent: 'sky'
      }
    ],
    tables: [
      {
        id: 'rates-table',
        title: 'Rates',
        columns: [
          { key: 'carrier', label: 'Carrier' },
          { key: 'prefix', label: 'Prefix' },
          { key: 'in', label: 'Inbound / min', align: 'right' },
          { key: 'out', label: 'Outbound / min', align: 'right' },
          { key: 'sms', label: 'SMS / segment', align: 'right' }
        ],
        rows: rates.map((rate) => ({
          id: rate.id,
          carrier: rate.carrier,
          prefix: `${rate.countryCode} ${rate.prefix}`,
          in: formatRate(rate.voiceInboundRateMicro),
          out: formatRate(rate.voiceOutboundRateMicro),
          sms: formatRate(rate.smsRateMicro)
        }))
      }
    ]
  };
}

export default async function BillingRatesPage() {
  const data = await getData();
  return <ResourceDashboard data={data} />;
}
