'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, Table, Badge } from '@/components/ui';

interface Order {
  id: string;
  order_number: string;
  order_date: string;
  store: { name: string };
  status: 'pending' | 'approved' | 'purchasing' | 'purchased' | 'distributed' | 'cancelled';
  items_count: number;
}

const statusLabels = {
  pending: { label: 'Pendente', variant: 'warning' as const },
  approved: { label: 'Aprovado', variant: 'info' as const },
  purchasing: { label: 'Em Compra', variant: 'info' as const },
  purchased: { label: 'Comprado', variant: 'success' as const },
  distributed: { label: 'Distribuído', variant: 'success' as const },
  cancelled: { label: 'Cancelado', variant: 'danger' as const },
};

export default function OrdersPage() {
  const [orders] = useState<Order[]>([
    { id: '1', order_number: 'PED-001', order_date: '2024-01-15', store: { name: 'Loja Centro' }, status: 'pending', items_count: 12 },
    { id: '2', order_number: 'PED-002', order_date: '2024-01-15', store: { name: 'Loja Norte' }, status: 'approved', items_count: 8 },
    { id: '3', order_number: 'PED-003', order_date: '2024-01-14', store: { name: 'Loja Sul' }, status: 'purchased', items_count: 15 },
  ]);

  return (
    <>
      <Header
        title="Pedidos"
        subtitle="Gerencie os pedidos das lojas"
        actions={
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Pedido
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <Table
            columns={[
              { key: 'order_number', header: 'Nº Pedido' },
              { key: 'order_date', header: 'Data' },
              {
                key: 'store',
                header: 'Loja',
                render: (order) => order.store.name,
              },
              {
                key: 'items_count',
                header: 'Itens',
                render: (order) => `${order.items_count} itens`,
              },
              {
                key: 'status',
                header: 'Status',
                render: (order) => (
                  <Badge variant={statusLabels[order.status].variant}>
                    {statusLabels[order.status].label}
                  </Badge>
                ),
              },
            ]}
            data={orders}
          />
        </Card>
      </div>
    </>
  );
}
