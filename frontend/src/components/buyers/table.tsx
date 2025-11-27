// frontend/src/components/buyers/table.tsx
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

type Buyer = components['schemas']['Buyer'];

const columns: ColumnDef<Buyer>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const name = row.getValue<string>('name');
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-50">
            {name}
          </span>
          <span className="text-xs text-slate-400">
            {row.original.id}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: 'endpoint_type',
    header: 'Endpoint Type',
    cell: ({ row }) => {
      const type = row.getValue<Buyer['endpoint_type']>('endpoint_type');
      return (
        <span className="text-sm text-slate-200">{type}</span>
      );
    }
  },
  {
    accessorKey: 'endpoint_value',
    header: 'Endpoint Value',
    cell: ({ row }) => {
      const value = row.getValue<string>('endpoint_value');
      return (
        <span className="text-sm text-slate-200">{value}</span>
      );
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue<Buyer['status']>('status');
      const isActive = status === 'ACTIVE';

      return (
        <Badge
          variant={isActive ? 'default' : 'outline'}
          className={
            isActive
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/40'
          }
        >
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'concurrency_limit',
    header: 'Concurrency',
    cell: ({ row }) => {
      const limit = row.getValue<number>('concurrency_limit');
      return (
        <span className="text-sm text-slate-200">{limit}</span>
      );
    }
  },
  {
    accessorKey: 'daily_cap',
    header: 'Daily Cap',
    cell: ({ row }) => {
      const cap = row.original.daily_cap;
      return (
        <span className="text-sm text-slate-200">
          {cap !== null && cap !== undefined ? cap : 'N/A'}
        </span>
      );
    }
  },
  {
    accessorKey: 'weight',
    header: 'Weight',
    cell: ({ row }) => {
      const weight = row.getValue<number>('weight');
      return (
        <span className="text-sm text-slate-200">{weight}</span>
      );
    }
  },
  {
    id: 'actions',
    header: '',
    size: 80,
    cell: ({ row }) => {
      const buyer = row.original;
      return (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-2 py-1 h-7"
            onClick={() => {
              console.log('Clicked buyer', buyer.id);
            }}
          >
            View
          </Button>
        </div>
      );
    }
  }
];

interface BuyersTableProps {
  buyers: Buyer[];
}

export function BuyersTable({ buyers }: BuyersTableProps) {
  const [data] = React.useState<Buyer[]>(buyers);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-200">
          {data.length} Buyer{data.length === 1 ? '' : 's'}
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
                  No buyers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
