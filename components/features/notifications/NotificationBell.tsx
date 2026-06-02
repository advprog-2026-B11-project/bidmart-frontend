'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { notificationApi } from '@/lib/api/notifications';
import { useAuth } from '@/hooks/useAuth';

const unreadCountCache = new Map<string, number>();
const unreadCountRequests = new Map<string, Promise<number>>();

export default function NotificationBell() {
  const { user, isLoading } = useAuth();
  const userId = user?.id;
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (isLoading) return;

    if (!userId) return;

    let ignore = false;
    const cachedCount = unreadCountCache.get(userId);
    if (cachedCount !== undefined) {
      Promise.resolve().then(() => {
        if (!ignore) setUnreadCount(cachedCount);
      });
    }

    const existingRequest = unreadCountRequests.get(userId);
    const request = existingRequest ??
      notificationApi.getUnreadNotifications(userId)
        .then(data => {
          const count = data.length;
          unreadCountCache.set(userId, count);
          return count;
        })
        .finally(() => {
          unreadCountRequests.delete(userId);
        });

    if (!existingRequest) unreadCountRequests.set(userId, request);

    request
      .then(count => {
        if (!ignore) setUnreadCount(count);
      })
      .catch(error => {
        if (!ignore) console.error(error);
      });

    return () => {
      ignore = true;
    };
  }, [userId, isLoading]);

  if (!user) return null;

  return (
    <Link href="/notifications" className="relative p-2 text-slate-900 hover:bg-gray-100 rounded-full transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
