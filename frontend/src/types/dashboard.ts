export type DashboardStat = {
  label: string;
  value: string;
  helper?: string;
  accent?: 'emerald' | 'rose' | 'amber' | 'sky' | 'violet' | 'slate';
  trend?: {
    label: string;
    value: string;
    direction: 'up' | 'down' | 'flat';
  };
};

export type DashboardChart = {
  id: string;
  title: string;
  type: 'sparkline' | 'bar' | 'heatmap' | 'progress';
  description?: string;
  data: Array<{ label: string; value: number }>;
  meta?: Record<string, string>;
};

export type DashboardTable = {
  id: string;
  title: string;
  description?: string;
  columns: Array<{ key: string; label: string; align?: 'left' | 'right' }>;
  rows: Array<Record<string, string>>;
  emptyState?: string;
};

export type DashboardTimelineItem = {
  id: string;
  title: string;
  status: string;
  date: string;
  description?: string;
  meta?: string;
};

export type DashboardSection = {
  id: string;
  title: string;
  body: string;
};

export type DashboardResponse = {
  title: string;
  description: string;
  stats: DashboardStat[];
  charts?: DashboardChart[];
  tables?: DashboardTable[];
  timeline?: DashboardTimelineItem[];
  sections?: DashboardSection[];
  generatedAt: string;
};
