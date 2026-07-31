import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import React from 'react';
import AlertToastNotification from '../components/dashboard/AlertToastNotification';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  const { token } = useAuthStore();
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (!token) return;
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const WS_URL = `ws://localhost:5000/ws?token=${token}`;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionAttempts(0);
      
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setLastEvent(parsed);

        switch (parsed.type) {
          case 'NEW_ALERT':
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            queryClient.invalidateQueries({ queryKey: ['analytics', 'dashboard'] });
            
            toast.custom(
              (t) => <AlertToastNotification alert={parsed.payload.alert} toastId={t.id} />,
              { duration: parsed.payload.alert.severity === 'critical' ? 8000 : 5000 }
            );
            break;
            
          case 'ALERT_UPDATED':
            queryClient.invalidateQueries({ queryKey: ['alerts'] });
            break;
            
          case 'ENGINE_STATS':
            queryClient.invalidateQueries({ queryKey: ['cloudtrail', 'engine'] });
            break;
            
          case 'CONNECTED':
          case 'PONG':
            break;
            
          default:
            break;
        }
      } catch (err) {
        // Silently ignore parse errors
      }
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      if (event.code === 4001) {
        return; // Unauthorized, don't reconnect
      }

      const delay = Math.min(1000 * Math.pow(2, connectionAttempts), 30000);
      reconnectTimeoutRef.current = setTimeout(() => {
        setConnectionAttempts((prev) => prev + 1);
        connect();
      }, delay);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };
  }, [token, connectionAttempts, queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [connect]);

  return { isConnected, lastEvent, reconnect: connect };
}
