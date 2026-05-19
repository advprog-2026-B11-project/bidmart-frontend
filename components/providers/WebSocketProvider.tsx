"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket, type WsStatus } from "@/hooks/useWebSocket";
import { NotificationType } from "@/constants/enums";
import { showOutbidToast } from "@/components/features/bidding/OutbidAlert";
import type { Notification } from "@/types/api";

/* ─── Context ─────────────────────────────────────────────────────────────── */

interface WebSocketContextValue {
  status: WsStatus;
  subscribe: (destination: string, callback: (body: string) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function useWebSocketContext(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocketContext must be used within WebSocketProvider");
  return ctx;
}

/* ─── Provider ────────────────────────────────────────────────────────────── */

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuth();
  const { status, subscribe }  = useWebSocket(accessToken);

  /* Subscribe to the user's notification queue once connected */
  useEffect(() => {
    if (!user || status !== "connected") return;

    const dest = `/user/${user.id}/queue/notifications`;

    const unsubscribe = subscribe(dest, (body) => {
      try {
        const notification = JSON.parse(body) as Notification;

        /* Broadcast a custom event so detail pages can react */
        window.dispatchEvent(
          new CustomEvent("ws-notification", { detail: notification })
        );

        /* OUTBID gets a prominent custom toast */
        if (notification.type === NotificationType.BID_OUTBID) {
          const listingId = notification.referenceId ?? "";
          showOutbidToast(listingId, notification.title);
          return;
        }

        /* All other notifications → standard Sonner toast */
        toast(notification.title, {
          description: notification.body,
          duration: 5_000,
        });
      } catch {}
    });

    return unsubscribe;
  }, [user, status, subscribe]);

  const value = useMemo<WebSocketContextValue>(
    () => ({ status, subscribe }),
    [status, subscribe]
  );

  return (
    <WebSocketContext.Provider value={value}>
      {children}
      <WsStatusIndicator status={status} />
    </WebSocketContext.Provider>
  );
}

/* ─── Live-connection dot ─────────────────────────────────────────────────── */

function WsStatusIndicator({ status }: { status: WsStatus }) {
  if (status === "disconnected") return null;

  const dotClass =
    status === "connected"
      ? "bg-emerald-400"
      : status === "connecting"
        ? "animate-pulse bg-yellow-400"
        : "bg-red-400";

  const label =
    status === "connected"  ? "Live"    :
    status === "connecting" ? "..."     : "Offline";

  return (
    <div
      title={`WebSocket: ${status}`}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 shadow ring-1 ring-slate-200 backdrop-blur-sm"
    >
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
    </div>
  );
}
