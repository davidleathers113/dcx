// frontend/src/components/dashboard/resource-dashboard.tsx
import type {
  DashboardResponse,
  DashboardChart,
  DashboardTable
} from '@/types/dashboard';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

function StatCard({ stat }: { stat: DashboardResponse['stats'][number] }) {
  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-950/60 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{stat.label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-50">{stat.value}</p>
      {stat.helper ? <p className="text-xs text-slate-500">{stat.helper}</p> : null}
      {stat.trend ? (
        <p className="mt-1 text-[11px] text-slate-400">
          {stat.trend.label}: {stat.trend.value} ({stat.trend.direction})
        </p>
      ) : null}
    </div>
  );
}

function ChartCard({ chart }: { chart: DashboardChart }) {
  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{chart.title}</p>
          {chart.description ? (
            <p className="text-[11px] text-slate-500">{chart.description}</p>
          ) : null}
        </div>
        {chart.meta ? (
          <Badge variant="outline" className="border-slate-800 text-[10px]">
            {Object.values(chart.meta).join(' • ')}
          </Badge>
        ) : null}
      </div>
      <div className="mt-4">
        {chart.type === 'heatmap' ? (
          <div className="grid grid-cols-6 gap-2">
            {chart.data.map((point) => (
              <div key={point.label} className="space-y-1">
                <div className="text-[10px] text-slate-500">{point.label}</div>
                <div
                  className="h-8 rounded-md"
                  style={{
                    backgroundColor: `rgba(16, 185, 129, ${Math.min(point.value / 10, 0.9)})`
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-end gap-2">
            {chart.data.map((point) => (
              <div key={point.label} className="flex-1">
                <div
                  className="rounded-t-md bg-gradient-to-t from-emerald-600/20 to-emerald-500/70"
                  style={{ height: `${Math.min(point.value, 100)}%` }}
                />
                <p className="mt-1 text-[10px] text-slate-500">{point.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DataTable({ table }: { table: DashboardTable }) {
  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-950/40">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-100">{table.title}</p>
          {table.description ? (
            <p className="text-xs text-slate-500">{table.description}</p>
          ) : null}
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-slate-900">
            {table.columns.map((column) => (
              <TableHead key={column.key} className="text-xs text-slate-400">
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.length ? (
            table.rows.map((row) => (
              <TableRow key={row.id ?? `${table.id}-${row[table.columns[0].key]}`}>
                {table.columns.map((column) => (
                  <TableCell
                    key={column.key}
                    className={`text-xs text-slate-200 ${
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {row[column.key] ?? '—'}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={table.columns.length} className="text-center text-xs text-slate-500">
                {table.emptyState ?? 'No records found.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function ResourceDashboard({ data }: { data: DashboardResponse }) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
          <p className="text-sm text-slate-400">{data.description}</p>
          <p className="text-[11px] text-slate-500">Updated {new Date(data.generatedAt).toLocaleString()}</p>
        </header>

        {data.stats.length ? (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </section>
        ) : null}

        {data.charts?.length ? (
          <section className="grid gap-4 md:grid-cols-2">
            {data.charts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} />
            ))}
          </section>
        ) : null}

        {data.tables?.length ? (
          <section className="space-y-4">
            {data.tables.map((table) => (
              <DataTable key={table.id} table={table} />
            ))}
          </section>
        ) : null}

        {data.sections?.length ? (
          <section className="grid gap-3 md:grid-cols-2">
            {data.sections.map((section) => (
              <div key={section.id} className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
                <p className="text-sm font-semibold text-slate-200">{section.title}</p>
                <p className="mt-1 text-xs text-slate-400">{section.body}</p>
              </div>
            ))}
          </section>
        ) : null}

        {data.timeline?.length ? (
          <section className="rounded-2xl border border-slate-900 bg-slate-950/30 p-4">
            <p className="text-sm font-semibold text-slate-200">Timeline</p>
            <div className="mt-4 space-y-3">
              {data.timeline.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <div className="flex-1">
                    <p className="text-sm text-slate-100">{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
