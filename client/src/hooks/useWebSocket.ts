import { useEffect, useRef } from 'react';

export function useWebSocket(playerId: number | undefined) {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!playerId) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      // Identify the player to the server
      ws.send(JSON.stringify({
        type: 'identify',
        playerId
      }));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [playerId]);

  return wsRef.current;
}
