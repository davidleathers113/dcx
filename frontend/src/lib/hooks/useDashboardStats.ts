'use client';

import { useEffect, useMemo, useState } from 'react';
import type { components } from '@/types/api';
import { apiClient } from '@/lib/api';

type CallSession = components['schemas']['CallSession'];

type DashboardStatsResponse = {
  calls: CallSession[];
  revenueCents: number;
  costCents: number;
  profitCents: number;
  backendHealthy: boolean | null;
  loading: boolean;
  error: unknown;
};

export function useDashboardStats(range: { from: string; to: string }): DashboardStatsResponse {
  const [state, setState] = useState<{
    data: CallSession[];
    loading: boolean;
    error: unknown;
  }>({ data: [], loading: true, error: null });
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setState((prev) => ({ ...prev, loading: true }));
      }
    });

    apiClient
      .GET('/api/calls', {
        params: {
          query: {
            from: range.from,
            to: range.to,
            page: 1,
            limit: 200
          }
        }
      })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setState({ data: [], loading: false, error });
          return;
        }
        const envelope = data as { data?: CallSession[] };
        setState({ data: envelope?.data ?? [], loading: false, error: null });
      });

    return () => {
      active = false;
    };
  }, [range.from, range.to]);

  useEffect(() => {
    let active = true;
    apiClient
      .GET('/health')
      .then(({ data }) => {
        if (active) {
          setBackendHealthy(data?.status === 'ok');
        }
      })
      .catch(() => {
        if (active) {
          setBackendHealthy(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const revenueCents = state.data.reduce(
      (sum, call) => sum + (call.revenue_estimated_cents ?? 0),
      0
    );
    const costCents = state.data.reduce(
      (sum, call) => sum + (call.telephony_cost_cents ?? 0),
      0
    );
    return {
      calls: state.data,
      revenueCents,
      costCents,
      profitCents: revenueCents - costCents,
      backendHealthy
    };
  }, [state.data, backendHealthy]);

  return {
    calls: stats.calls,
    revenueCents: stats.revenueCents,
    costCents: stats.costCents,
    profitCents: stats.profitCents,
    backendHealthy: stats.backendHealthy,
    loading: state.loading,
    error: state.error
  };
}

