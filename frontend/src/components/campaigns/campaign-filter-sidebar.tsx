// frontend/src/components/campaigns/campaign-filter-sidebar.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { ListFilter } from 'lucide-react';

export function CampaignFilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // A helper to update the URL query string
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );
  
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      router.push(`/campaigns?${createQueryString('filters[status]', e.target.value)}`);
  };

  const handleVerticalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      router.push(`/campaigns?${createQueryString('filters[vertical]', e.target.value)}`);
  };

  const handleHasActiveBuyersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.checked ? 'true' : '';
      router.push(`/campaigns?${createQueryString('filters[has_active_buyers]', value)}`);
  };

  return (
    <div className="border-l border-slate-800 bg-slate-950/80 p-4 space-y-6">
        <div className="flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold tracking-tight">Filters</h2>
        </div>

        <div className="space-y-4">
            {/* Status Filter */}
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-300">Status</label>
                <select 
                    id="status"
                    name="status"
                    className="mt-1 block w-full rounded-md border-slate-700 bg-slate-800 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                    onChange={handleStatusChange}
                    defaultValue={searchParams.get('filters[status]') || ''}
                >
                    <option value="">All</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                </select>
            </div>

            {/* Vertical Filter */}
            <div>
                <label htmlFor="vertical" className="block text-sm font-medium text-slate-300">Vertical</label>
                <input
                    type="text"
                    id="vertical"
                    name="vertical"
                    className="mt-1 block w-full rounded-md border-slate-700 bg-slate-800 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
                    placeholder="e.g. MEDICARE,INSURANCE"
                    onChange={handleVerticalChange}
                    defaultValue={searchParams.get('filters[vertical]') || ''}
                />
            </div>
            
            {/* Has Active Buyers Filter */}
            <div className="flex items-center gap-2 pt-2">
                <input
                    id="has_active_buyers"
                    name="has_active_buyers"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-emerald-600 focus:ring-emerald-500"
                    onChange={handleHasActiveBuyersChange}
                    defaultChecked={searchParams.get('filters[has_active_buyers]') === 'true'}
                />
                <label htmlFor="has_active_buyers" className="text-sm text-slate-300">
                    Has Active Buyers
                </label>
            </div>
        </div>
    </div>
  );
}
