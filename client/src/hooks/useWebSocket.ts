import { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export function useWebSocket(playerId: number | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttemptRef = useRef(0);
  const { toast } = useToast();

  const connect = useCallback(() => {
    if (!playerId || wsRef.current?.readyState === WebSocket.OPEN) return;

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      // Create WebSocket connection
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      console.log('Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptRef.current = 0;

        // Identify the player to the server
        ws.send(JSON.stringify({
          type: 'identify',
          playerId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          if (data.type === 'connected') {
            console.log('Connection confirmed by server');
          } else if (data.type === 'identified') {
            console.log('Player identification confirmed:', data.playerId);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        const maxReconnectDelay = 5000;
        const baseDelay = 1000;
        const delay = Math.min(
          baseDelay * Math.pow(2, reconnectAttemptRef.current),
          maxReconnectDelay
        );

        reconnectAttemptRef.current++;

        if (reconnectAttemptRef.current <= 5) {
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptRef.current})`);
          setTimeout(connect, delay);
        } else {
          toast({
            title: "Connection Lost",
            description: "Unable to connect to the game server after multiple attempts. Please try refreshing the page.",
            variant: "destructive",
          });
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast({
          title: "Connection Error",
          description: "Lost connection to the game server. Attempting to reconnect...",
          variant: "destructive",
        });
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the game server. Please check your internet connection.",
        variant: "destructive",
      });
    }
  }, [playerId, toast]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        console.log('Cleaning up WebSocket connection');
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    socket: wsRef.current,
    isConnected
  };
}

export default useWebSocket;