"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import * as notificationsApi from "@/lib/api/notifications";
import type { Notification } from "@/types/api";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    notificationsApi.getUnread().then(setNotifications).catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleMarkAllRead = () => {
    notificationsApi.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-semibold text-slate-900">Notifikasi</span>
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-600 hover:underline"
            >
              Tandai semua dibaca
            </button>
          </div>

          {/* List */}
          <div className="max-h-72 divide-y divide-slate-50 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                Tidak ada notifikasi baru
              </p>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div key={n.id} className={cn("px-4 py-3", !n.read && "bg-blue-50/50")}>
                  <p className="text-sm font-medium leading-snug text-slate-900">
                    {n.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.body}</p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Lihat semua notifikasi →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
