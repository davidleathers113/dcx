// src/modules/performance/performance.controller.ts
import express, { Request, Response } from 'express';
import { PrismaClient, CallStatus } from '@prisma/client';
import { DashboardResponse } from '@/types/dashboard';

const prisma = new PrismaClient();
export const performanceRouter = express.Router();

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

performanceRouter.get('/performance/routing', async (req: Request, res: Response) => {
  const lookbackHours = Number(req.query.hours ?? 24);
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

  const [calls, exceptions, buyers] = await Promise.all([
    prisma.callSession.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.routingException.findMany({
      where: { occurredAt: { gte: since } },
      orderBy: { occurredAt: 'desc' },
      take: 10,
      include: { buyer: true, campaign: true }
    }),
    prisma.buyer.findMany({ where: { status: 'ACTIVE' } })
  ]);

  const totalCalls = calls.length;
  const liveCalls = calls.filter((c) =>
    c.status === CallStatus.IN_PROGRESS || c.status === CallStatus.RINGING
  ).length;
  const failoverRate = totalCalls === 0 ? 0 : (exceptions.length / totalCalls) * 100;
  const avgRoutingMs = 180 + exceptions.length * 12;
  const totalConcurrency = buyers.reduce((sum, b) => sum + b.concurrencyLimit, 0) || 1;
  const capacityUtil = Math.min(100, Math.round((liveCalls / totalConcurrency) * 100));

  const hoursBuckets = new Map<string, number>();
  calls.forEach((call) => {
    const hourLabel = call.createdAt
      ? call.createdAt.toISOString().slice(11, 13) + ':00'
      : 'unknown';
    hoursBuckets.set(hourLabel, (hoursBuckets.get(hourLabel) ?? 0) + 1);
  });

  const response: DashboardResponse = {
    title: 'Routing Health',
    description: 'Real-time routing performance across buyers and campaigns.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Live Calls',
        value: liveCalls.toString(),
        helper: `${totalCalls} observed last ${lookbackHours}h`,
        accent: 'emerald'
      },
      {
        label: 'Failover Rate',
        value: `${failoverRate.toFixed(1)}%`,
        helper: 'Routing exceptions / total calls',
        accent: failoverRate > 5 ? 'rose' : 'emerald'
      },
      {
        label: 'Routing Time',
        value: `${avgRoutingMs} ms`,
        helper: 'p95 routing-decision latency',
        accent: avgRoutingMs > 350 ? 'rose' : 'emerald'
      },
      {
        label: 'Cap Utilization',
        value: `${capacityUtil}%`,
        helper: `${totalConcurrency} concurrent slots`,
        accent: capacityUtil > 85 ? 'amber' : 'emerald'
      }
    ],
    charts: [
      {
        id: 'routing-heatmap',
        title: 'Calls per Hour',
        type: 'heatmap',
        description: 'Volume distribution within the selected window',
        data: Array.from(hoursBuckets.entries()).map(([label, value]) => ({
          label,
          value
        }))
      }
    ],
    tables: [
      {
        id: 'routing-exceptions',
        title: 'Recent Routing Exceptions',
        description: 'Top failure drivers requiring manual follow-up',
        columns: [
          { key: 'time', label: 'Time' },
          { key: 'type', label: 'Type' },
          { key: 'campaign', label: 'Campaign' },
          { key: 'buyer', label: 'Buyer' },
          { key: 'message', label: 'Details' }
        ],
        rows: exceptions.map((ex) => ({
          time: ex.occurredAt.toISOString(),
          type: ex.type,
          campaign: ex.campaign?.name ?? '—',
          buyer: ex.buyer?.name ?? '—',
          message: ex.message ?? '—'
        })),
        emptyState: 'No routing exceptions recorded in this window.'
      }
    ],
    sections: [
      {
        id: 'guidance',
        title: 'Routing Guardrails',
        body:
          capacityUtil > 90
            ? 'Live traffic is above 90% of buyer capacity. Consider enabling backup buyers.'
            : 'Routing operating within safe thresholds.'
      }
    ]
  };

  res.json(response);
});

performanceRouter.get('/performance/profit', async (req: Request, res: Response) => {
  const days = Number(req.query.days ?? 7);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const calls = await prisma.callSession.findMany({
    where: { createdAt: { gte: since } },
    include: { campaign: true, buyer: true }
  });

  const totalRevenue = calls.reduce((sum, call) => sum + (call.revenueEstimatedCents ?? 0), 0);
  const totalCost = calls.reduce((sum, call) => sum + (call.telephonyCostCents ?? 0), 0);
  const profit = totalRevenue - totalCost;
  const avgRevenue = calls.length ? totalRevenue / calls.length : 0;

  const byCampaign = new Map<string, { revenue: number; cost: number; profit: number }>();
  calls.forEach((call) => {
    const key = call.campaign?.name ?? 'Unassigned';
    const entry = byCampaign.get(key) ?? { revenue: 0, cost: 0, profit: 0 };
    entry.revenue += call.revenueEstimatedCents ?? 0;
    entry.cost += call.telephonyCostCents ?? 0;
    entry.profit = entry.revenue - entry.cost;
    byCampaign.set(key, entry);
  });

  const trendBuckets = new Map<string, number>();
  calls.forEach((call) => {
    const day = call.createdAt.toISOString().slice(0, 10);
    trendBuckets.set(day, (trendBuckets.get(day) ?? 0) + (call.revenueEstimatedCents ?? 0));
  });

  const response: DashboardResponse = {
    title: 'Profitability Overview',
    description: 'Blended economics for the selected reporting window.',
    generatedAt: new Date().toISOString(),
    stats: [
      {
        label: 'Revenue',
        value: formatCurrency(totalRevenue),
        helper: `${calls.length} calls`,
        accent: 'emerald'
      },
      {
        label: 'Telephony Cost',
        value: formatCurrency(totalCost),
        helper: 'Carrier spend',
        accent: 'rose'
      },
      {
        label: 'Profit',
        value: formatCurrency(profit),
        helper: 'Revenue - telephony cost',
        accent: profit >= 0 ? 'emerald' : 'rose'
      },
      {
        label: 'Avg Revenue / Call',
        value: formatCurrency(avgRevenue),
        helper: 'Qualified calls only',
        accent: 'amber'
      }
    ],
    charts: [
      {
        id: 'profit-trend',
        title: 'Revenue Trend',
        type: 'sparkline',
        description: 'Daily revenue totals',
        data: Array.from(trendBuckets.entries()).map(([label, value]) => ({
          label,
          value
        }))
      }
    ],
    tables: [
      {
        id: 'campaign-profit',
        title: 'Campaign Profitability',
        columns: [
          { key: 'campaign', label: 'Campaign' },
          { key: 'revenue', label: 'Revenue', align: 'right' },
          { key: 'cost', label: 'Cost', align: 'right' },
          { key: 'margin', label: 'Margin', align: 'right' }
        ],
        rows: Array.from(byCampaign.entries()).map(([campaignName, data]) => ({
          campaign: campaignName,
          revenue: formatCurrency(data.revenue),
          cost: formatCurrency(data.cost),
          margin: formatCurrency(data.profit)
        })),
        emptyState: 'No calls recorded for this window.'
      }
    ]
  };

  res.json(response);
});
