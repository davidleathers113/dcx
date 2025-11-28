// src/lib/hooks/useLiveMetrics.ts
import { useState, useEffect } from 'react';

const WS_URL = 'ws://localhost:4000/ws/live-metrics';

export function useLiveMetrics() {
  const [liveCallCount, setLiveCallCount] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('Connected to live metrics WebSocket');
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'live-call-count') {
          setLiveCallCount(message.count);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('Disconnected from live metrics WebSocket');
      setIsConnected(false);
      // Optional: implement reconnect logic here
    };

    // Clean up the connection when the component unmounts
    return () => {
      ws.close();
    };
  }, []); // Empty dependency array ensures this runs only once

  return { liveCallCount, isConnected };
}
