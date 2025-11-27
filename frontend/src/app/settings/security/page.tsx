import { apiFetch } from '@/lib/api';

type SecurityPreference = {
  id: string;
  mfaRequired: boolean;
  ipAllowList?: string[] | null;
  lastAuditAt?: string | null;
  webhookSigningSecret?: string | null;
  apiKeyRotationDays: number;
  defaultRecordingEnabled: boolean;
  cdrRetentionDays: number;
  defaultBuyerCap?: number | null;
};

type SecurityEvent = {
  id: string;
  message: string;
  severity: string;
  createdAt: string;
};

type SecurityResponse = {
  preference: SecurityPreference | null;
  recentEvents: SecurityEvent[];
};

async function getData(): Promise<SecurityResponse> {
  return apiFetch<SecurityResponse>('/api/settings/security');
}

export default async function SecuritySettingsPage() {
  const data = await getData();
  const pref = data.preference;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Security Posture</h1>
          <p className="text-sm text-slate-400">
            MFA policy, webhook signing, and platform guardrails.
          </p>
        </header>

        {pref ? (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
              <p className="text-xs text-slate-500">MFA Required</p>
              <p className="text-2xl font-semibold text-slate-50">
                {pref.mfaRequired ? 'Enabled' : 'Disabled'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
              <p className="text-xs text-slate-500">API Key Rotation</p>
              <p className="text-2xl font-semibold text-slate-50">
                {pref.apiKeyRotationDays} days
              </p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
              <p className="text-xs text-slate-500">Recording Default</p>
              <p className="text-2xl font-semibold text-slate-50">
                {pref.defaultRecordingEnabled ? 'On' : 'Off'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
              <p className="text-xs text-slate-500">CDR Retention</p>
              <p className="text-2xl font-semibold text-slate-50">
                {pref.cdrRetentionDays} days
              </p>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
          <p className="text-sm font-semibold text-slate-200">IP Allow List</p>
          <div className="mt-2 space-y-1 text-xs text-slate-400">
            {pref?.ipAllowList?.map((cidr) => (
              <p key={cidr}>{cidr}</p>
            )) ?? <p>No IP allow list configured.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
          <p className="text-sm font-semibold text-slate-200">Recent Security Events</p>
          <div className="mt-3 space-y-2">
            {data.recentEvents.length ? (
              data.recentEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-slate-900 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400">
                    {new Date(event.createdAt).toLocaleString()} · {event.severity}
                  </p>
                  <p className="text-sm text-slate-100">{event.message}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No recent security logs.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
