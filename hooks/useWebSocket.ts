"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export type WsStatus = "connecting" | "connected" | "disconnected" | "error";

interface UseWebSocketReturn {
  status: WsStatus;
  subscribe: (destination: string, callback: (body: string) => void) => () => void;
}

const MAX_RETRIES = 5;

export function useWebSocket(token: string | null): UseWebSocketReturn {
  const [status, setStatus] = useState<WsStatus>("disconnected");

  const clientRef      = useRef<Client | null>(null);
  const subsRef        = useRef<Map<string, ReturnType<Client["subscribe"]>>>(new Map());
  const pendingSubsRef = useRef<Map<string, (body: string) => void>>(new Map());
  const retryCountRef  = useRef(0);
  const retryTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const staleClient = clientRef.current;
      clientRef.current = null;
      subsRef.current.clear();
      retryCountRef.current = 0;
      /* Defer setState to satisfy react-hooks/set-state-in-effect rule */
      if (staleClient) {
        staleClient.deactivate().finally(() => setStatus("disconnected")).catch(() => {});
      } else {
        Promise.resolve().then(() => setStatus("disconnected"));
      }
      return;
    }

    retryCountRef.current = 0;

    function start(accessToken: string) {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      clientRef.current?.deactivate().catch(() => {});

      setStatus("connecting");

      const client = new Client({
        webSocketFactory: () => new SockJS(process.env.NEXT_PUBLIC_WS_URL!),
        connectHeaders: { Authorization: `Bearer ${accessToken}` },
        reconnectDelay: 0,
        onConnect: () => {
          setStatus("connected");
          retryCountRef.current = 0;
          subsRef.current.clear();
          pendingSubsRef.current.forEach((cb, dest) => {
            try {
              const sub = client.subscribe(dest, (frame) => cb(frame.body));
              subsRef.current.set(dest, sub);
            } catch {}
          });
        },
        onDisconnect: () => setStatus("disconnected"),
        onStompError:    () => retry(accessToken),
        onWebSocketError: () => retry(accessToken),
      });

      clientRef.current = client;
      client.activate();
    }

    function retry(accessToken: string) {
      setStatus("error");
      if (retryCountRef.current >= MAX_RETRIES) return;
      const delay = Math.min(1000 * 2 ** retryCountRef.current, 30_000);
      retryCountRef.current += 1;
      retryTimerRef.current = setTimeout(() => start(accessToken), delay);
    }

    start(token);

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      clientRef.current?.deactivate().catch(() => {});
      clientRef.current = null;
    };
  }, [token]);

  const subscribe = useCallback(
    (destination: string, callback: (body: string) => void): (() => void) => {
      pendingSubsRef.current.set(destination, callback);

      if (clientRef.current?.connected) {
        try {
          const sub = clientRef.current.subscribe(destination, (frame) =>
            callback(frame.body)
          );
          subsRef.current.set(destination, sub);
        } catch {}
      }

      return () => {
        pendingSubsRef.current.delete(destination);
        const sub = subsRef.current.get(destination);
        if (sub) {
          try { sub.unsubscribe(); } catch {}
          subsRef.current.delete(destination);
        }
      };
    },
    []
  );

  return { status, subscribe };
}
