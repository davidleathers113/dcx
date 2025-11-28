// frontend/src/lib/hooks/useVoicemails.ts
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import type { components } from '@/types/api';

// This is a hypothetical type based on the backend controller response
type Voicemail = {
    id: string;
    status: string;
    priority: string;
    recordingUrl: string;
    transcription?: string | null;
    assignedTo?: { id: string; name: string; avatarUrl?: string | null; } | null;
    notes?: string | null;
    callbackScheduledAt?: string | null;
    receivedAt: string;
    callerId?: string | null;
};

export function useVoicemails() {
  const [voicemails, setVoicemails] = useState<Voicemail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  const fetchVoicemails = useCallback(async () => {
    setLoading(true);
    const { data, error: apiError } = await apiClient.GET('/api/calls/voicemails');
    if (apiError) {
      setError(apiError);
    } else if (data) {
      setVoicemails(data as Voicemail[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVoicemails();
  }, [fetchVoicemails]);

  const assignVoicemail = async (voicemailId: string, teamMemberId: string) => {
    const { error: apiError } = await apiClient.PATCH('/api/calls/voicemails/{id}/assign', {
        params: { path: { id: voicemailId } },
        body: { teamMemberId },
    });
    if (apiError) {
        throw new Error('Failed to assign voicemail');
    }
    await fetchVoicemails(); // Refresh list after action
  };
  
  const scheduleCallback = async (voicemailId: string, dueAt?: string, notes?: string) => {
    const { error: apiError } = await apiClient.POST('/api/calls/voicemails/{id}/schedule-callback', {
        params: { path: { id: voicemailId } },
        body: { dueAt, notes },
    });
    if (apiError) {
        throw new Error('Failed to schedule callback');
    }
    await fetchVoicemails(); // Refresh list after action
  };

  return { voicemails, loading, error, refetch: fetchVoicemails, assignVoicemail, scheduleCallback };
}
