'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, Table, Badge } from '@/components/ui';

interface Distribution {
  id: string;
  purchase: { purchase_number: string };
  store: { name: string };
  distribution_date: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'partial';
}

const statusLabels = {
  pending: { label: 'Pendente', variant: 'warning' as const },
  in_transit: { label: 'Em Trânsito', variant: 'info' as const },
  delivered: { label: 'Entregue', variant: 'success' as const },
  partial: { label: 'Parcial', variant: 'warning' as const },
};

export default function DistributionsPage() {
  const [distributions] = useState<Distribution[]>([
    { id: '1', purchase: { purchase_number: 'COM-001' }, store: { name: 'Loja Centro' }, distribution_date: '2024-01-15', status: 'pending' },
    { id: '2', purchase: { purchase_number: 'COM-001' }, store: { name: 'Loja Norte' }, distribution_date: '2024-01-15', status: 'in_transit' },
    { id: '3', purchase: { purchase_number: 'COM-002' }, store: { name: 'Loja Sul' }, distribution_date: '2024-01-14', status: 'delivered' },
  ]);

  return (
    <>
      <Header
        title="Distribuições"
        subtitle="Gerencie a distribuição de compras para as lojas"
        actions={
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Distribuição
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <Table
            columns={[
              {
                key: 'purchase',
                header: 'Compra',
                render: (d) => d.purchase.purchase_number,
              },
              {
                key: 'store',
                header: 'Loja',
                render: (d) => d.store.name,
              },
              { key: 'distribution_date', header: 'Data' },
              {
                key: 'status',
                header: 'Status',
                render: (d) => (
                  <Badge variant={statusLabels[d.status].variant}>
                    {statusLabels[d.status].label}
                  </Badge>
                ),
              },
            ]}
            data={distributions}
          />
        </Card>
      </div>
    </>
  );
}
