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
const DEFAULT_WS_URL = "/ws";
const PROXIED_TRANSPORTS = ["xhr-streaming", "xhr-polling"];

function resolveSockJsEndpoint(configuredUrl: string): {
  url: string;
  useHttpTransports: boolean;
} {
  if (typeof window === "undefined") {
    return { url: configuredUrl, useHttpTransports: false };
  }

  const url = configuredUrl.startsWith("/")
    ? new URL(configuredUrl, window.location.origin)
    : new URL(configuredUrl);

  return {
    url: url.toString(),
    useHttpTransports: url.origin === window.location.origin,
  };
}

export function useWebSocket(token: string | null): UseWebSocketReturn {
  const [status, setStatus] = useState<WsStatus>("disconnected");

  const clientRef      = useRef<Client | null>(null);
  const subsRef        = useRef<Map<string, ReturnType<Client["subscribe"]>>>(new Map());
  const pendingSubsRef = useRef<Map<string, (body: string) => void>>(new Map());
  const retryCountRef  = useRef(0);
  const retryTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const setSafeStatus = (nextStatus: WsStatus) => {
      if (!cancelled) setStatus(nextStatus);
    };

    if (!token) {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      const staleClient = clientRef.current;
      clientRef.current = null;
      subsRef.current.clear();
      retryCountRef.current = 0;
      /* Defer setState to satisfy react-hooks/set-state-in-effect rule */
      if (staleClient) {
        staleClient.deactivate().finally(() => setSafeStatus("disconnected")).catch(() => {});
      } else {
        Promise.resolve().then(() => setSafeStatus("disconnected"));
      }
      return () => {
        cancelled = true;
      };
    }

    retryCountRef.current = 0;

    function start(accessToken: string) {
      if (cancelled) return;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
      clientRef.current?.deactivate().catch(() => {});

      setSafeStatus("connecting");

      let endpoint: ReturnType<typeof resolveSockJsEndpoint>;
      try {
        endpoint = resolveSockJsEndpoint(
          process.env.NEXT_PUBLIC_WS_URL ?? DEFAULT_WS_URL
        );
      } catch {
        setSafeStatus("error");
        return;
      }

      const client = new Client({
        webSocketFactory: () =>
          new SockJS(
            endpoint.url,
            undefined,
            endpoint.useHttpTransports
              ? { transports: PROXIED_TRANSPORTS }
              : undefined
          ),
        connectHeaders: { Authorization: `Bearer ${accessToken}` },
        reconnectDelay: 0,
        onConnect: () => {
          setSafeStatus("connected");
          retryCountRef.current = 0;
          subsRef.current.clear();
          pendingSubsRef.current.forEach((cb, dest) => {
            try {
              const sub = client.subscribe(dest, (frame) => cb(frame.body));
              subsRef.current.set(dest, sub);
            } catch {}
          });
        },
        onDisconnect: () => setSafeStatus("disconnected"),
        onStompError:    () => retry(accessToken),
        onWebSocketError: () => retry(accessToken),
      });

      clientRef.current = client;
      client.activate();
    }

    function retry(accessToken: string) {
      if (cancelled) return;
      setSafeStatus("error");
      if (retryCountRef.current >= MAX_RETRIES || retryTimerRef.current) return;
      const delay = Math.min(1000 * 2 ** retryCountRef.current, 30_000);
      retryCountRef.current += 1;
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        start(accessToken);
      }, delay);
    }

    start(token);

    return () => {
      cancelled = true;
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
