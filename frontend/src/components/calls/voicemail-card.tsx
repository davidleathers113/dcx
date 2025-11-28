// frontend/src/components/calls/voicemail-card.tsx
'use client';

import type { useVoicemails } from '@/lib/hooks/useVoicemails';
import { Phone, User, Calendar, Clock, Tag, MessageSquare, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type Voicemail = ReturnType<typeof useVoicemails>['voicemails'][0];

interface VoicemailCardProps {
  voicemail: Voicemail;
  onAssign: (voicemailId: string, teamMemberId: string) => void;
  onScheduleCallback: (voicemailId: string) => void;
}

function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

export function VoicemailCard({ voicemail, onAssign, onScheduleCallback }: VoicemailCardProps) {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
        case 'NEW': return <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/30">New</Badge>;
        case 'ACTIVE': return <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/30">Active</Badge>;
        case 'ARCHIVED': return <Badge variant="secondary">Archived</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-full"><Phone className="h-5 w-5 text-slate-300" /></div>
          <div>
            <p className="font-semibold text-slate-100">{voicemail.callerId || 'Unknown Caller'}</p>
            <p className="text-xs text-slate-400">{timeAgo(voicemail.receivedAt)}</p>
          </div>
        </div>
        {getStatusBadge(voicemail.status)}
      </div>

      <audio controls src={voicemail.recordingUrl} className="w-full h-10" />

      {voicemail.transcription && (
        <div className="text-sm text-slate-300 p-3 bg-slate-800/50 rounded-md border border-slate-700/50">
            <p className="italic">{voicemail.transcription}</p>
        </div>
      )}

      <div className="border-t border-slate-800 pt-4 space-y-3 text-sm">
        <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">Assigned To:</span>
            {voicemail.assignedTo ? (
                <span className="font-semibold text-slate-200">{voicemail.assignedTo.name}</span>
            ) : (
                <span className="text-slate-500 italic">Unassigned</span>
            )}
        </div>
         <div className="flex items-center gap-3">
            <Tag className="h-4 w-4 text-slate-500" />
            <span className="text-slate-400">Priority:</span>
            <span className="font-semibold text-slate-200">{voicemail.priority}</span>
        </div>
        {voicemail.notes && (
            <div className="flex items-start gap-3">
                <MessageSquare className="h-4 w-4 text-slate-500 mt-0.5" />
                <p className="text-slate-300 flex-1">{voicemail.notes}</p>
            </div>
        )}
      </div>

      <div className="flex gap-2">
        <button 
            className="flex-1 rounded-md bg-slate-700/50 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            onClick={() => onAssign(voicemail.id, 'user_placeholder_id')} // Placeholder for user selection
        >
            <User className="h-4 w-4 mr-1.5 inline-block" />
            Assign
        </button>
        <button
            className="flex-1 rounded-md bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
            onClick={() => onScheduleCallback(voicemail.id)}
        >
            <Calendar className="h-4 w-4 mr-1.5 inline-block" />
            Schedule Callback
        </button>
      </div>
    </div>
  );
}
