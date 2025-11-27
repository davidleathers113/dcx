import { apiFetch } from '@/lib/api';
import { PreferencesForm } from '@/components/settings/preferences-form';

type PreferencesResponse = {
  defaultRecordingEnabled: boolean;
  cdrRetentionDays: number;
  defaultBuyerCap: number;
};

async function getPreferences(): Promise<PreferencesResponse> {
  return apiFetch<PreferencesResponse>('/api/settings/preferences');
}

export default async function PreferencesPage() {
  const prefs = await getPreferences();
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Platform Preferences</h1>
          <p className="text-sm text-slate-400">
            Control recording defaults, retention, and buyer caps.
          </p>
        </header>
        <section className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4">
          <PreferencesForm initial={prefs} />
        </section>
      </div>
    </main>
  );
}
