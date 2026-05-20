'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { orderApi, Order } from '@/lib/api/orders';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Spinner } from '@/components/ui/Spinner';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [trackingInput, setTrackingInput] = useState<string>('');
  const [disputeInput, setDisputeInput] = useState<string>('');
  const [showDisputeForm, setShowDisputeForm] = useState<boolean>(false);

  useEffect(() => {
    if (id && user?.id) {
      orderApi.getOrdersByBuyer(user.id)
        .then((res) => {
          const found = res.find((o) => o.id === id);
          if (found) setOrder(found);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id, user]);

  const handleUpdateTracking = async () => {
    if (!order || !user || !trackingInput) return;
    try {
      const updated = await orderApi.updateTrackingNumber(order.id, user.id, trackingInput);
      setOrder(updated);
    } catch (error) {
      console.error(error);
    }
  };

  const handleConfirmDelivery = async () => {
    if (!order || !user) return;
    try {
      const updated = await orderApi.confirmDelivery(order.id, user.id);
      setOrder(updated);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDisputeOrder = async () => {
    if (!order || !user || !disputeInput) return;
    try {
      const updated = await orderApi.disputeOrder(order.id, user.id, disputeInput);
      setOrder(updated);
      setShowDisputeForm(false);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return <div className="p-6 text-center">Data transaksi tidak ditemukan.</div>;
  }

  const isBuyer = user?.id === order.buyerId;
  const isSeller = user?.id === order.sellerId;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Button variant="outline" onClick={() => router.push('/orders')} className="mb-4">
        Kembali ke Daftar Pesanan
      </Button>

      <Card className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Detail Pesanan</h2>
            <p className="text-xs text-gray-400">ID: {order.id}</p>
          </div>
          <Badge variant={
            order.status === 'DELIVERED' ? 'success' :
            order.status === 'SHIPPED' ? 'info' :
            order.status === 'DISPUTED' ? 'destructive' : 'default'
          }>
            {order.status}
          </Badge>
        </div>

        <div className="border-t border-b py-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Total Pembayaran:</span>
            <span className="font-bold">Rp {order.amount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Nomor Resi:</span>
            <span className="font-mono">{order.trackingNumber || 'Belum dimasukkan'}</span>
          </div>
          {order.disputeReason && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
              <p className="font-semibold">Alasan Sengketa:</p>
              <p>{order.disputeReason}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {isSeller && order.status === 'PENDING' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Input Nomor Resi Pengiriman</label>
              <div className="flex gap-2">
                <Input
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Masukkan nomor resi..."
                />
                <Button onClick={handleUpdateTracking}>Kirim Resi</Button>
              </div>
            </div>
          )}

          {isBuyer && order.status === 'SHIPPED' && (
            <div className="flex gap-4">
              <Button onClick={handleConfirmDelivery} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                Konfirmasi Barang Diterima
              </Button>
              <Button onClick={() => setShowDisputeForm(!showDisputeForm)} variant="destructive">
                Ajukan Komplain (Dispute)
              </Button>
            </div>
          )}

          {showDisputeForm && (
            <div className="p-4 border rounded space-y-3 bg-gray-50">
              <label className="text-sm font-medium">Alasan Pengajuan Sengketa</label>
              <Textarea
                value={disputeInput}
                onChange={(e) => setDisputeInput(e.target.value)}
                placeholder="Tuliskan detail keluhan atau ketidaksesuaian barang di sini..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDisputeForm(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDisputeOrder}>Kirim Laporan</Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}