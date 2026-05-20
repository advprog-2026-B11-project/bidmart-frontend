'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notificationApi, NotificationPreference } from '@/lib/api/notifications';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

export default function NotificationPreferencesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [preference, setPreference] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    if (user?.id) {
      notificationApi.getPreferences(user.id)
        .then(setPreference)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id || !preference) return;
    setSaving(true);
    try {
      await notificationApi.updatePreferences(user.id, {
        emailEnabled: preference.emailEnabled,
        pushEnabled: preference.pushEnabled,
        inAppEnabled: preference.inAppEnabled,
        mutedTypes: preference.mutedTypes
      });
      router.push('/notifications');
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const toggleMutedType = (type: string) => {
    if (!preference) return;
    const current = preference.mutedTypes || [];
    const updated = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setPreference({ ...preference, mutedTypes: updated });
  };

  if (loading) return <div className="flex justify-center items-center min-h-[50vh]"><Spinner /></div>;
  if (!preference) return null;

  return (
    <div className="max-w-xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/notifications')} className="mb-6">
        Kembali
      </Button>
      
      <h1 className="text-2xl font-bold mb-6">Preferensi Notifikasi</h1>
      
      <Card className="p-6 space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Kanal Pengiriman</h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={preference.inAppEnabled} 
              onChange={(e) => setPreference({...preference, inAppEnabled: e.target.checked})}
              className="w-5 h-5"
            />
            <span>Notifikasi Dalam Aplikasi (In-App)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={preference.pushEnabled} 
              onChange={(e) => setPreference({...preference, pushEnabled: e.target.checked})}
              className="w-5 h-5"
            />
            <span>Notifikasi Push (WebSocket)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={preference.emailEnabled} 
              onChange={(e) => setPreference({...preference, emailEnabled: e.target.checked})}
              className="w-5 h-5"
            />
            <span>Notifikasi Email</span>
          </label>
        </div>

        <div className="pt-4 border-t space-y-4">
          <h3 className="font-semibold text-lg">Mute Tipe Notifikasi</h3>
          <p className="text-sm text-gray-500">Pilih tipe yang tidak ingin Anda terima:</p>
          <div className="flex flex-wrap gap-2">
            {['PROMO', 'SYSTEM_ALERT', 'NEW_BID', 'AUCTION_WON', 'ORDER_DELIVERED'].map((type) => {
              const isMuted = (preference.mutedTypes || []).includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleMutedType(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${isMuted ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}
                >
                  {type} {isMuted && '(Muted)'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-6">
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? 'Menyimpan...' : 'Simpan Preferensi'}
          </Button>
        </div>
      </Card>
    </div>
  );
}