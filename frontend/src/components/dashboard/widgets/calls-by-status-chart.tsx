'use client';

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';

type ChartDatum = {
  status: string;
  count: number;
};

const COLORS = ['#34d399', '#fbbf24', '#60a5fa', '#f87171', '#a78bfa', '#f472b6'];

type CallsByStatusChartProps = {
  data: ChartDatum[];
};

export function CallsByStatusChart({ data }: CallsByStatusChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-500">
        No calls in this range.
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.status} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#020617',
              borderColor: '#1e293b',
              borderRadius: 8
            }}
            formatter={(value, name) => [`${value as number} calls`, name as string]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
        {data.map((entry, index) => (
          <div key={entry.status} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="uppercase tracking-wide">{entry.status}</span>
            <span className="ml-auto font-semibold text-slate-100">
              {entry.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

