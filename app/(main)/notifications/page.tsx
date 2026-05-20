'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { notificationApi, Notification } from '@/lib/api/notifications';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user?.id) {
      notificationApi.getUserNotifications(user.id)
        .then(setNotifications)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const updated = await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? updated : n));
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await notificationApi.markAllAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[50vh]"><Spinner /></div>;
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center mt-10">
        <Card className="p-8 space-y-4">
          <h2 className="text-xl font-semibold">Akses Ditolak</h2>
          <Link href="/auth/login" className="inline-block bg-black text-white px-4 py-2 rounded">
            Login
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Notifikasi</h1>
        <div className="space-x-3">
          <Link href="/notifications/preferences">
            <Button variant="outline">Pengaturan</Button>
          </Link>
          <Button onClick={handleMarkAllAsRead}>Tandai Semua Dibaca</Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          Belum ada notifikasi.
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <Card key={notif.id} className={`p-4 flex justify-between items-start transition-colors ${notif.read ? 'bg-white' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex-1 cursor-pointer" onClick={() => !notif.read && handleMarkAsRead(notif.id)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-gray-500">{notif.type}</span>
                  {!notif.read && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
                </div>
                <p className="text-sm font-medium">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notif.createdAt).toLocaleString('id-ID')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleDelete(notif.id)} className="ml-4 text-red-600 border-red-200 hover:bg-red-50">
                Hapus
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}