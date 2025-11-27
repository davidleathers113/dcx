// frontend/src/app/settings/page.tsx
import { apiClient } from '@/lib/api';

// Manually forcing dynamic rendering so Next.js builds skip backend-dependent prerender.
export const dynamic = 'force-dynamic';

type Settings = {
  twilio_sid: string;
  twilio_auth_token_masked: string;
  outbound_webhook_url: string;
  // Add other settings as they become available in the API
};

async function getSettings(): Promise<Settings | null> {
  const { data, error } = await apiClient.GET('/api/settings');

  if (error) {
    console.error('Error fetching settings:', error);
    return null;
  }

  // Assuming the API directly returns the settings object
  return data as Settings;
}

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage application configurations.
            </p>
          </div>
        </header>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
          {settings ? (
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-slate-200">
                API Configurations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Twilio SID:</p>
                  <p className="text-base text-slate-50">
                    {settings.twilio_sid}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Twilio Auth Token:</p>
                  <p className="text-base text-slate-50">
                    {settings.twilio_auth_token_masked}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">
                    Outbound Webhook URL:
                  </p>
                  <p className="text-base text-slate-50">
                    {settings.outbound_webhook_url || 'N/A'}
                  </p>
                </div>
              </div>
              {/* Future: Add forms for editing these settings */}
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Could not load settings. Please check backend.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
