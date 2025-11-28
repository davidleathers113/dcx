// frontend/src/components/calls/live-calls-table.tsx
'use client';

import { useState, useEffect } from 'react';
import type { LiveCall } from '@/lib/hooks/useLiveCalls';
import { Phone, Mic, Ear, User, Building, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// A small component to display a real-time updating duration
function CallDurationTimer({ startTime }: { startTime: string | null | undefined }) {
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!startTime) {
            setDuration(0);
            return;
        }

        const start = new Date(startTime).getTime();
        const timer = setInterval(() => {
            const now = Date.now();
            setDuration(Math.floor((now - start) / 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    return <span>{formatDuration(duration)}</span>;
}


export function LiveCallsTable({ liveCalls }: { liveCalls: LiveCall[] }) {
    if (liveCalls.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border border-dashed border-slate-700 rounded-xl">
                <Phone className="h-12 w-12 text-slate-600" />
                <h3 className="mt-4 text-lg font-semibold text-slate-300">No Active Calls</h3>
                <p className="text-sm text-slate-500">Waiting for new calls to come in...</p>
            </div>
        );
    }
    
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'RINGING':
                return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-300 border-yellow-500/30">Ringing</Badge>;
            case 'IN_PROGRESS':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30">In Progress</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-900">
                    <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Status</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Caller</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Duration</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Buyer</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Campaign</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-400">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                    {liveCalls.map((call) => (
                        <tr key={call.id} className="hover:bg-slate-900/50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{getStatusBadge(call.status)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{call.fromNumber}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 tabular-nums">
                                <CallDurationTimer startTime={call.answeredAt || call.createdAt} />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">{call.buyer?.name || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">{call.campaign?.name || 'N/A'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                                <button className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 disabled:opacity-50" title="Listen In"><Ear className="h-4 w-4" /></button>
                                <button className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 disabled:opacity-50" title="Whisper"><Mic className="h-4 w-4" /></button>
                                <button className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 disabled:opacity-50" title="Barge In"><Shield className="h-4 w-4" /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
