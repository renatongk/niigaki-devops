'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, Table, Badge } from '@/components/ui';

interface Return {
  id: string;
  return_number: string;
  return_date: string;
  store: { name: string };
  type: 'to_supplier' | 'from_store';
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  total_value: number;
}

const statusLabels = {
  pending: { label: 'Pendente', variant: 'warning' as const },
  approved: { label: 'Aprovada', variant: 'info' as const },
  processed: { label: 'Processada', variant: 'success' as const },
  rejected: { label: 'Rejeitada', variant: 'danger' as const },
};

const typeLabels = {
  to_supplier: 'Para Fornecedor',
  from_store: 'Da Loja',
};

export default function ReturnsPage() {
  const [returns] = useState<Return[]>([
    { id: '1', return_number: 'DEV-001', return_date: '2024-01-15', store: { name: 'Loja Centro' }, type: 'to_supplier', status: 'pending', total_value: 250.00 },
    { id: '2', return_number: 'DEV-002', return_date: '2024-01-14', store: { name: 'Loja Norte' }, type: 'from_store', status: 'processed', total_value: 180.00 },
    { id: '3', return_number: 'DEV-003', return_date: '2024-01-14', store: { name: 'Loja Sul' }, type: 'to_supplier', status: 'approved', total_value: 320.00 },
  ]);

  return (
    <>
      <Header
        title="Devoluções"
        subtitle="Gerencie as devoluções de mercadorias"
        actions={
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Devolução
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <Table
            columns={[
              { key: 'return_number', header: 'Nº Devolução' },
              { key: 'return_date', header: 'Data' },
              {
                key: 'store',
                header: 'Loja',
                render: (r) => r.store.name,
              },
              {
                key: 'type',
                header: 'Tipo',
                render: (r) => typeLabels[r.type],
              },
              {
                key: 'total_value',
                header: 'Valor',
                render: (r) => `R$ ${r.total_value.toFixed(2)}`,
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <Badge variant={statusLabels[r.status].variant}>
                    {statusLabels[r.status].label}
                  </Badge>
                ),
              },
            ]}
            data={returns}
          />
        </Card>
      </div>
    </>
  );
}
