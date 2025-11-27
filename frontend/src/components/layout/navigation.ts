import {
  Activity,
  Bell,
  Cog,
  DollarSign,
  LayoutDashboard,
  MessageSquare,
  Phone,
  Puzzle,
  Shield,
  Settings,
  Users
} from 'lucide-react';

// Manually centralized Trackdrive-inspired IA so sidebar + drawers stay in sync.
export type NavLinkConfig = {
  label: string;
  href: string;
  description?: string;
};

export type NavSectionConfig = {
  id: string;
  label: string;
  icon: typeof LayoutDashboard;
  items: NavLinkConfig[];
};

export const navSections: NavSectionConfig[] = [
  {
    id: 'analytics',
    label: 'Analytics',
    icon: LayoutDashboard,
    items: [
      { label: 'Overview', href: '/' },
      { label: 'Schedules', href: '/dashboards/schedules' }
      // Manually removed Classic Dashboard link per product request.
    ]
  },
  {
    id: 'setup-system',
    label: 'Setup System',
    icon: Settings,
    items: [
      { label: 'Campaigns', href: '/campaigns' },
      { label: 'Traffic Sources', href: '/traffic-sources' },
      { label: 'Buyers', href: '/buyers' },
      { label: 'Suppliers', href: '/suppliers' },
      { label: 'Schedules', href: '/schedules' },
      { label: 'Number Pools', href: '/ring-pools' },
      { label: 'Numbers', href: '/numbers' }
    ]
  },
  {
    id: 'calls',
    label: 'Calls',
    icon: Phone,
    items: [
      { label: 'Call Logs', href: '/calls' },
      { label: 'Live Calls', href: '/calls/live' },
      { label: 'Voicemail', href: '/calls/voicemail' },
      { label: 'Scheduled Callbacks', href: '/calls/callbacks' }
    ]
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: MessageSquare,
    items: [
      { label: 'Overview', href: '/sms' },
      { label: 'Incoming', href: '/sms/incoming' },
      { label: 'Outgoing', href: '/sms/outgoing' },
      { label: 'Bulk Sends', href: '/sms/blasts' }
    ]
  },
  {
    id: 'leads',
    label: 'Leads',
    icon: Users,
    items: [
      { label: 'View Leads', href: '/leads' },
      { label: 'Summary Reports', href: '/leads/report' },
      { label: 'Imports', href: '/leads/imports' },
      { label: 'Retargeting', href: '/leads/retargets' }
    ]
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Puzzle,
    items: [
      { label: 'Manage Integrations', href: '/integrations' },
      { label: 'Providers', href: '/providers' },
      { label: 'API & Tokens', href: '/integrations/api' },
      { label: 'Webhooks', href: '/webhooks' }
    ]
  },
  {
    id: 'company',
    label: 'Company',
    icon: Cog,
    items: [
      { label: 'Settings', href: '/settings' },
      { label: 'Preferences', href: '/settings/preferences' },
      { label: 'Security', href: '/settings/security' },
      { label: 'Teams', href: '/teams' },
      { label: 'Users', href: '/team-members' },
      { label: 'Secrets', href: '/secret-items' }
    ]
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: DollarSign,
    items: [
      { label: 'Usage', href: '/billing/usage' },
      { label: 'Payments', href: '/billing/payments' },
      { label: 'Rate Sheet', href: '/billing/rates' },
      { label: 'Statements', href: '/billing/statements' }
    ]
  },
  {
    id: 'alerts',
    label: 'Notices',
    icon: Bell,
    items: [
      { label: 'System Notices', href: '/notices' },
      { label: 'Monitors & Alerts', href: '/alerts' }
    ]
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: Shield,
    items: [
      { label: 'Audit Logs', href: '/system-logs' },
      { label: 'Webhook Logs', href: '/webhook-logs' },
      { label: 'Platform Migrations', href: '/platform-migrations' }
    ]
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: Activity,
    items: [
      { label: 'Profitability', href: '/performance/profit' },
      { label: 'Routing Health', href: '/performance/routing' }
    ]
  }
];

