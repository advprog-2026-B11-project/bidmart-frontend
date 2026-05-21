'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { orderApi, Order } from '@/lib/api/orders';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user?.id) {
      orderApi.getOrdersByBuyer(user.id)
        .then(setOrders)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center mt-10">
        <Card className="p-8 space-y-4">
          <h2 className="text-xl font-semibold">Akses Ditolak</h2>
          <p className="text-gray-500">Silakan login terlebih dahulu untuk melihat daftar pesanan Anda.</p>
          <Link href="/auth/login" className="inline-block bg-black text-white px-4 py-2 rounded">
            Ke Halaman Login
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Daftar Transaksi Pesanan</h1>
      {orders.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          Belum ada transaksi pesanan yang tercatat.
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="p-4 hover:border-black transition-all cursor-pointer flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-gray-500">ID Pesanan: {order.id}</p>
                  <p className="font-semibold text-lg mt-1">
                    Rp {order.amount.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Dibuat: {new Date(order.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="text-right">
                  <Badge variant={
                    order.status === 'DELIVERED' ? 'success' :
                    order.status === 'SHIPPED' ? 'info' :
                    order.status === 'DISPUTED' ? 'danger' : 'default'
                  }>
                    {order.status}
                  </Badge>
                  {order.trackingNumber && (
                    <p className="text-xs text-gray-500 mt-2">Resi: {order.trackingNumber}</p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
