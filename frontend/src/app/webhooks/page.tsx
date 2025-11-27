import { apiFetch } from '@/lib/api';
import { WebhookTable, type WebhookSubscription } from '@/components/webhooks/webhook-table';

async function getWebhooks(): Promise<WebhookSubscription[]> {
  return apiFetch<WebhookSubscription[]>('/api/webhooks');
}

export default async function WebhooksPage() {
  const webhooks = await getWebhooks();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Webhook Endpoints</h1>
          <p className="text-sm text-slate-400">
            Subscriber health, retry posture, and manual replay tooling.
          </p>
        </header>
        <WebhookTable webhooks={webhooks} />
      </div>
    </main>
  );
}
