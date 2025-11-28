// frontend/src/app/calls/live/page.tsx
'use client';

import { useLiveCalls } from '@/lib/hooks/useLiveCalls';
import { LiveCallsTable } from '@/components/calls/live-calls-table';
import { Wifi } from 'lucide-react';

export default function LiveCallsPage() {
    const { liveCalls, isConnected } = useLiveCalls();

    return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
            <div className="mx-auto max-w-7xl px-6 py-8 space-y-6">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Live Calls Monitor</h1>
                        <p className="text-sm text-slate-400">
                            A real-time view of all active calls currently in the system.
                        </p>
                    </div>
                    <div className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs ${isConnected ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'}`}>
                        <Wifi className="h-4 w-4" />
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                </header>

                <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-sm">
                    <LiveCallsTable liveCalls={liveCalls} />
                </section>
            </div>
        </main>
    );
}