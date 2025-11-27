// frontend/src/components/suppliers/table.tsx
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

type Supplier = components['schemas']['Supplier'];

const columns: ColumnDef<Supplier>[] = [
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
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue<Supplier['type']>('type');
      return (
        <span className="text-sm text-slate-200">{type}</span>
      );
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue<Supplier['status']>('status');
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
    accessorKey: 'contact_email',
    header: 'Contact Email',
    cell: ({ row }) => {
      const email = row.getValue<string>('contact_email');
      return (
        <span className="text-xs text-slate-400">
          {email || 'N/A'}
        </span>
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
    size: 80,
    cell: ({ row }) => {
      const supplier = row.original;
      return (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-xs px-2 py-1 h-7"
            onClick={() => {
              console.log('Clicked supplier', supplier.id);
            }}
          >
            View
          </Button>
        </div>
      );
    }
  }
];

interface SuppliersTableProps {
  suppliers: Supplier[];
}

export function SuppliersTable({ suppliers }: SuppliersTableProps) {
  const [data] = React.useState<Supplier[]>(suppliers);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-200">
          {data.length} Supplier{data.length === 1 ? '' : 's'}
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
                  No suppliers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
