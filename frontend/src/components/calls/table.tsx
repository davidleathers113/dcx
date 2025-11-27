// frontend/src/components/calls/table.tsx
'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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

type CallSession = components['schemas']['CallSession'];

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const columns: ColumnDef<CallSession>[] = [
  {
    accessorKey: 'id',
    header: 'Call ID',
    cell: ({ row }) => {
      const id = row.getValue<string>('id');
      return (
        <span className="text-sm font-medium text-slate-50">
          {id.substring(0, 8)}...
        </span>
      );
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Time',
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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue<CallSession['status']>('status');
      let badgeClass = 'bg-slate-800 text-slate-300 border-slate-600';
      if (status === 'COMPLETED') {
        badgeClass = 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40';
      } else if (status === 'FAILED') {
        badgeClass = 'bg-rose-500/20 text-rose-200 border-rose-500/40';
      }
      return (
        <Badge variant="outline" className={badgeClass}>
          {status}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'revenue_estimated_cents',
    header: 'Revenue',
    cell: ({ row }) => {
      const revenue = row.getValue<number>('revenue_estimated_cents');
      return (
        <span className="text-sm text-emerald-300">
          {formatMoney(revenue ?? 0)}
        </span>
      );
    }
  },
  {
    accessorKey: 'telephony_cost_cents',
    header: 'Cost',
    cell: ({ row }) => {
      const cost = row.getValue<number>('telephony_cost_cents');
      return (
        <span className="text-sm text-rose-300">
          {formatMoney(cost ?? 0)}
        </span>
      );
    }
  },
  {
    accessorKey: 'campaign_id',
    header: 'Campaign',
    cell: ({ row }) => {
      const campaignId = row.getValue<string>('campaign_id');
      return (
        <span className="text-xs text-slate-400">
          {campaignId ? campaignId.substring(0, 8) + '...' : 'N/A'}
        </span>
      );
    }
  },
  {
    id: 'actions',
    header: '',
    size: 80,
    cell: ({ row }) => {
      const callSession = row.original;
      return (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-2 py-1 h-7"
            onClick={() => {
              console.log('Clicked call session', callSession.id);
            }}
          >
            View
          </Button>
        </div>
      );
    }
  }
];

interface CallsTableProps {
  calls: CallSession[];
}

export function CallsTable({ calls }: CallsTableProps) {
  const [data] = React.useState<CallSession[]>(calls);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-200">
          {data.length} Call{data.length === 1 ? '' : 's'}
        </h2>
      </div>

      <div className="rounded-lg border border-slate-800 bg-slate-950/40 overflow-hidden">
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
                <TableRow
                  key={row.id}
                  className="border-slate-800 hover:bg-slate-900/70"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="text-xs text-slate-200"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-xs text-slate-500"
                >
                  No call sessions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
