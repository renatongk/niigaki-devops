'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, Table, Badge } from '@/components/ui';

interface Purchase {
  id: string;
  purchase_number: string;
  purchase_date: string;
  supplier: { name: string };
  total_amount: number;
  payment_status: 'pending' | 'partial' | 'paid';
}

const statusLabels = {
  pending: { label: 'Pendente', variant: 'warning' as const },
  partial: { label: 'Parcial', variant: 'info' as const },
  paid: { label: 'Pago', variant: 'success' as const },
};

export default function PurchasesPage() {
  const [purchases] = useState<Purchase[]>([
    { id: '1', purchase_number: 'COM-001', purchase_date: '2024-01-15', supplier: { name: 'Fornecedor A' }, total_amount: 2500.00, payment_status: 'pending' },
    { id: '2', purchase_number: 'COM-002', purchase_date: '2024-01-15', supplier: { name: 'Fornecedor B' }, total_amount: 1850.00, payment_status: 'paid' },
    { id: '3', purchase_number: 'COM-003', purchase_date: '2024-01-14', supplier: { name: 'Fornecedor C' }, total_amount: 3200.00, payment_status: 'partial' },
  ]);

  return (
    <>
      <Header
        title="Compras"
        subtitle="Gerencie as compras realizadas no CEASA"
        actions={
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Compra
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <Table
            columns={[
              { key: 'purchase_number', header: 'Nº Compra' },
              { key: 'purchase_date', header: 'Data' },
              {
                key: 'supplier',
                header: 'Fornecedor',
                render: (purchase) => purchase.supplier.name,
              },
              {
                key: 'total_amount',
                header: 'Valor Total',
                render: (purchase) => `R$ ${purchase.total_amount.toFixed(2)}`,
              },
              {
                key: 'payment_status',
                header: 'Pagamento',
                render: (purchase) => (
                  <Badge variant={statusLabels[purchase.payment_status].variant}>
                    {statusLabels[purchase.payment_status].label}
                  </Badge>
                ),
              },
            ]}
            data={purchases}
          />
        </Card>
      </div>
    </>
  );
}
