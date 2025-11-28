// frontend/src/app/calls/voicemail/page.tsx
'use client';

import { useVoicemails } from '@/lib/hooks/useVoicemails';
import { VoicemailCard } from '@/components/calls/voicemail-card';
import { Inbox } from 'lucide-react';

export default function VoicemailsPage() {
  const { voicemails, loading, error, assignVoicemail, scheduleCallback } = useVoicemails();

  const handleAssign = async (voicemailId: string, teamMemberId: string) => {
    try {
      // In a real app, you'd have a modal to select a team member.
      // For now, we'll use a placeholder.
      await assignVoicemail(voicemailId, teamMemberId);
      alert('Voicemail assigned!');
    } catch (e) {
      alert('Failed to assign voicemail.');
    }
  };

  const handleScheduleCallback = async (voicemailId: string) => {
    try {
      await scheduleCallback(voicemailId);
      alert('Callback scheduled!');
    } catch (e) {
      alert('Failed to schedule callback.');
    }
  };
  
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Voicemail Inbox</h1>
          <p className="text-sm text-slate-400">
            Review, assign, and schedule callbacks for voicemails.
          </p>
        </header>

        {loading && <div className="text-center p-12">Loading voicemails...</div>}
        {error && <div className="text-center p-12 text-rose-400">Error loading voicemails.</div>}

        {!loading && !error && voicemails.length === 0 && (
            <div className="flex flex-col items-center justify-center h-80 border border-dashed border-slate-700 rounded-xl">
                <Inbox className="h-16 w-16 text-slate-600" />
                <h3 className="mt-4 text-xl font-semibold text-slate-300">Inbox is Empty</h3>
                <p className="text-sm text-slate-500">All voicemails have been handled.</p>
            </div>
        )}

        {!loading && !error && voicemails.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {voicemails.map(vm => (
                    <VoicemailCard 
                        key={vm.id} 
                        voicemail={vm}
                        onAssign={handleAssign}
                        onScheduleCallback={handleScheduleCallback}
                    />
                ))}
            </div>
        )}
      </div>
    </main>
  );
}