'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { notificationApi } from '@/lib/api/notifications';
import { useAuth } from '@/hooks/useAuth';

export default function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (user?.id) {
      notificationApi.getUnreadNotifications(user.id)
        .then(data => setUnreadCount(data.length))
        .catch(console.error);
    }
  }, [user]);

  if (!user) return null;

  return (
    <Link href="/notifications" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
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
