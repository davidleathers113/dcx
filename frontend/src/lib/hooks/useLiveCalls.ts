// frontend/src/lib/hooks/useLiveCalls.ts
import { useState, useEffect } from 'react';

const WS_URL = 'ws://localhost:4000/ws/live-calls';

// Define a type for the call data we expect from the WebSocket
export interface LiveCall {
    id: string;
    fromNumber: string;
    status: string;
    createdAt: string; // ISO string
    answeredAt?: string | null; // ISO string
    buyer: { id: string; name: string } | null;
    campaign: { id: string; name: string; vertical: string } | null;
    trafficSource: { id: string; name: string } | null;
}

export function useLiveCalls() {
  const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to live calls WebSocket');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'live-calls') {
          setLiveCalls(message.calls);
        }
      } catch (error) {
        console.error('Error parsing live calls message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Live calls WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('Disconnected from live calls WebSocket');
      setIsConnected(false);
      setLiveCalls([]); // Clear calls on disconnect
    };

    // Clean up the connection when the component unmounts
    return () => {
      ws.close();
    };
  }, []); // Empty dependency array ensures this runs only once

  return { liveCalls, isConnected };
}
