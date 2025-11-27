// frontend/src/components/campaigns/table.tsx
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable
} from '@tanstack/react-table';
import type { components } from '@/types/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, Search, Filter } from 'lucide-react';

type Campaign = components['schemas']['Campaign'];
type CampaignStatus = Campaign['status']; // 'ACTIVE' | 'INACTIVE'

interface CampaignsTableProps {
  campaigns: Campaign[];
}

// Manually mirrored Trackdrive filters to keep the setup UX aligned.
const statusOptions: Array<{ label: string; value: 'ALL' | CampaignStatus }> = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' }
];

export function CampaignsTable({ campaigns }: CampaignsTableProps) {
  const [statusFilter, setStatusFilter] =
    React.useState<'ALL' | CampaignStatus>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [selectedCampaign, setSelectedCampaign] = React.useState<Campaign | null>(null);

  const filteredData = React.useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesStatus =
        statusFilter === 'ALL' ? true : campaign.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesQuery =
        !query ||
        campaign.name.toLowerCase().includes(query) ||
        campaign.id.toLowerCase().includes(query);
      return matchesStatus && matchesQuery;
    });
  }, [campaigns, statusFilter, searchQuery]);

  const columns = React.useMemo<ColumnDef<Campaign>[]>(() => {
    return [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
            aria-label={`Select campaign ${row.original.name}`}
          />
        ),
        size: 32
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => {
          return (
            <div className="flex items-start gap-2">
              <button
                type="button"
                className="mt-1 rounded border border-slate-800 bg-slate-900/60 p-1 text-slate-400 hover:text-slate-200"
                onClick={row.getToggleExpandedHandler()}
                aria-label="Toggle details"
              >
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${
                    row.getIsExpanded() ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-50">
                  {row.original.name}
                </span>
                <span className="text-xs text-slate-500">{row.original.id}</span>
              </div>
            </div>
          );
        }
      },
      {
        accessorKey: 'vertical',
        header: 'Vertical',
        cell: ({ row }) => (
          <span className="text-sm text-slate-200">{row.original.vertical}</span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.original.status === 'ACTIVE';
          return (
            <Badge
              variant={isActive ? 'default' : 'outline'}
              className={
                isActive
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-600'
              }
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          );
        }
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: ({ row }) => {
          const created = row.original.created_at as string | undefined;
          const date = created ? new Date(created) : null;
          return (
            <span className="text-xs text-slate-400">
              {date ? date.toLocaleString() : '—'}
            </span>
          );
        }
      },
      {
        id: 'actions',
        header: '',
        size: 90,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-2 py-1 h-7"
              onClick={() => setSelectedCampaign(row.original)}
            >
              View
            </Button>
          </div>
        )
      }
    ];
  }, []);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      rowSelection,
      expanded
    },
    onRowSelectionChange: setRowSelection,
    onExpandedChange: setExpanded,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-slate-200">
          {filteredData.length} Campaign{filteredData.length === 1 ? '' : 's'}
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              className="rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-3 text-xs text-slate-100 placeholder:text-slate-600 focus:border-slate-600 focus:outline-none"
              placeholder="Search name or ID"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-2 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <select
              className="appearance-none rounded-lg border border-slate-800 bg-slate-950 pl-8 pr-6 text-xs text-slate-100 focus:border-slate-600 focus:outline-none"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'ALL' | CampaignStatus)
              }
            >
              {statusOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
          <span>{selectedCount} selected</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-200"
              onClick={() =>
                console.log('Paused campaigns', Object.keys(rowSelection))
              }
            >
              Pause Selected
            </button>
            <button
              type="button"
              className="rounded border border-slate-800 px-3 py-1 text-slate-200"
              onClick={() =>
                console.log('Duplicated campaigns', Object.keys(rowSelection))
              }
            >
              Duplicate
            </button>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/40">
        <Table>
          <TableHeader className="bg-slate-900/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-slate-800">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-medium text-slate-400"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow className="border-slate-800 hover:bg-slate-900/70">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-xs text-slate-200">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() ? (
                    <TableRow className="border-slate-900 bg-slate-950/80">
                      <TableCell
                        colSpan={row.getVisibleCells().length}
                        className="text-xs text-slate-400"
                      >
                        <ExpandedDetails campaign={row.original} />
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-xs text-slate-500"
                >
                  No campaigns found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CampaignDrawer campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} />
    </div>
  );
}

function ExpandedDetails({ campaign }: { campaign: Campaign }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Campaign ID</p>
        <p className="text-sm text-slate-100">{campaign.id}</p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Created</p>
        <p className="text-sm text-slate-100">
          {campaign.created_at ? new Date(campaign.created_at).toLocaleString() : '—'}
        </p>
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Updated</p>
        <p className="text-sm text-slate-100">
          {campaign.updated_at ? new Date(campaign.updated_at).toLocaleString() : '—'}
        </p>
      </div>
    </div>
  );
}

function CampaignDrawer({
  campaign,
  onClose
}: {
  campaign: Campaign | null;
  onClose: () => void;
}) {
  if (!campaign) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        role="presentation"
      />
      <div className="relative ml-auto flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-950 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-slate-500">Campaign</p>
            <h3 className="text-lg font-semibold text-slate-100">{campaign.name}</h3>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="space-y-4 text-sm text-slate-300">
          <div className="flex justify-between">
            <span>Vertical</span>
            <span>{campaign.vertical}</span>
          </div>
          <div className="flex justify-between">
            <span>Status</span>
            <span>{campaign.status}</span>
          </div>
          <div className="flex justify-between">
            <span>Created</span>
            <span>
              {campaign.created_at
                ? new Date(campaign.created_at).toLocaleString()
                : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Updated</span>
            <span>
              {campaign.updated_at
                ? new Date(campaign.updated_at).toLocaleString()
                : '—'}
            </span>
          </div>
        </div>
        <div className="mt-auto flex gap-2 pt-6">
          <Button
            className="flex-1"
            onClick={() => console.log('Navigating to edit', campaign.id)}
          >
            Edit Campaign
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => console.log('Opening routing', campaign.id)}
          >
            Routing
          </Button>
        </div>
      </div>
    </div>
  );
}
