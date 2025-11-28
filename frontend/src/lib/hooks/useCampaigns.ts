// frontend/src/lib/hooks/useCampaigns.ts
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import type { components } from '@/types/api';

type Campaign = components['schemas']['Campaign'];
type Filters = Record<string, string | string[] | undefined>;

export function useCampaigns(filters: Filters) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);
  const [meta, setMeta] = useState<{ total: number; page: number; limit: number } | null>(null);

  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      setError(null);

      // Build the query parameters, including the nested 'filters' object
      const queryParams: Record<string, any> = { page: 1, limit: 100 };
      if (filters) {
          queryParams.filters = filters;
      }

      const { data, error: apiError } = await apiClient.GET('/api/campaigns', {
        params: {
          query: queryParams,
        },
      });

      if (apiError) {
        console.error('Error fetching campaigns:', apiError);
        setError(apiError);
      } else if (data) {
        setCampaigns((data.data ?? []) as Campaign[]);
        setMeta(data.meta ?? null);
      }
      setLoading(false);
    }

    fetchCampaigns();
  }, [JSON.stringify(filters)]); // Re-run effect when filters change

  return { campaigns, loading, error, meta };
}
