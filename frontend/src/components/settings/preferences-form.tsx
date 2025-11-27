'use client';

import { useState, useTransition } from 'react';
import { apiMutate } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Preferences = {
  defaultRecordingEnabled: boolean;
  cdrRetentionDays: number;
  defaultBuyerCap: number;
};

type Props = {
  initial: Preferences;
};

export function PreferencesForm({ initial }: Props) {
  const [form, setForm] = useState<Preferences>(initial);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);
    startTransition(async () => {
      await apiMutate('/api/settings/preferences', {
        method: 'PATCH',
        body: form
      });
      setStatus('Saved');
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span className="text-slate-200">Default Recording Enabled</span>
        <select
          value={form.defaultRecordingEnabled ? 'true' : 'false'}
          onChange={(event) =>
            setForm((state) => ({
              ...state,
              defaultRecordingEnabled: event.target.value === 'true'
            }))
          }
          className="w-full rounded-md border border-slate-800 bg-slate-900 p-2 text-slate-100"
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-slate-200">CDR Retention (days)</span>
        <input
          type="number"
          min={30}
          value={form.cdrRetentionDays}
          onChange={(event) =>
            setForm((state) => ({
              ...state,
              cdrRetentionDays: Number(event.target.value)
            }))
          }
          className="w-full rounded-md border border-slate-800 bg-slate-900 p-2 text-slate-100"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="text-slate-200">Default Buyer Cap</span>
        <input
          type="number"
          min={0}
          value={form.defaultBuyerCap}
          onChange={(event) =>
            setForm((state) => ({ ...state, defaultBuyerCap: Number(event.target.value) }))
          }
          className="w-full rounded-md border border-slate-800 bg-slate-900 p-2 text-slate-100"
        />
      </label>

      <Button type="submit" disabled={pending} className="text-sm">
        {pending ? 'Saving…' : 'Save Preferences'}
      </Button>

      {status ? <p className="text-xs text-emerald-300">{status}</p> : null}
    </form>
  );
}
