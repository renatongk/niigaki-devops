'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, Table } from '@/components/ui';

interface SupplierPayment {
  id: string;
  supplier: { name: string };
  purchase?: { purchase_number: string };
  amount: number;
  payment_method: string;
  payment_date: string;
}

export default function SupplierPaymentsPage() {
  const [payments] = useState<SupplierPayment[]>([
    { id: '1', supplier: { name: 'Fornecedor A' }, purchase: { purchase_number: 'COM-001' }, amount: 2500.00, payment_method: 'PIX', payment_date: '2024-01-15' },
    { id: '2', supplier: { name: 'Fornecedor B' }, purchase: { purchase_number: 'COM-002' }, amount: 1850.00, payment_method: 'Transferência', payment_date: '2024-01-14' },
    { id: '3', supplier: { name: 'Fornecedor A' }, amount: 500.00, payment_method: 'Dinheiro', payment_date: '2024-01-14' },
  ]);

  return (
    <>
      <Header
        title="Pagamentos a Fornecedores"
        subtitle="Registre os pagamentos realizados"
        actions={
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Pagamento
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <Table
            columns={[
              {
                key: 'supplier',
                header: 'Fornecedor',
                render: (p) => p.supplier.name,
              },
              {
                key: 'purchase',
                header: 'Compra',
                render: (p) => p.purchase?.purchase_number || '-',
              },
              {
                key: 'amount',
                header: 'Valor',
                render: (p) => `R$ ${p.amount.toFixed(2)}`,
              },
              { key: 'payment_method', header: 'Forma' },
              { key: 'payment_date', header: 'Data' },
            ]}
            data={payments}
          />
        </Card>
      </div>
    </>
  );
}
