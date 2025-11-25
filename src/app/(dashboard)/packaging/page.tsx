'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, Table } from '@/components/ui';

interface PackagingType {
  id: string;
  name: string;
  code: string;
  deposit_value: number;
  total_balance: number;
}

interface PackagingBalance {
  id: string;
  packaging: { name: string };
  store?: { name: string };
  supplier?: { name: string };
  balance: number;
}

export default function PackagingPage() {
  const [packagingTypes] = useState<PackagingType[]>([
    { id: '1', name: 'Caixa Plástica', code: 'CXP', deposit_value: 5.00, total_balance: 150 },
    { id: '2', name: 'Caixa Madeira', code: 'CXM', deposit_value: 3.00, total_balance: 80 },
    { id: '3', name: 'Engradado', code: 'ENG', deposit_value: 8.00, total_balance: 45 },
  ]);

  const [balances] = useState<PackagingBalance[]>([
    { id: '1', packaging: { name: 'Caixa Plástica' }, store: { name: 'Loja Centro' }, balance: 50 },
    { id: '2', packaging: { name: 'Caixa Plástica' }, store: { name: 'Loja Norte' }, balance: 30 },
    { id: '3', packaging: { name: 'Caixa Plástica' }, supplier: { name: 'Fornecedor A' }, balance: -25 },
    { id: '4', packaging: { name: 'Caixa Madeira' }, store: { name: 'Loja Sul' }, balance: 40 },
    { id: '5', packaging: { name: 'Engradado' }, supplier: { name: 'Fornecedor B' }, balance: -15 },
  ]);

  return (
    <>
      <Header
        title="Embalagens Retornáveis"
        subtitle="Controle de saldo de embalagens"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Registrar Movimento
            </Button>
            <Button>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Novo Tipo
            </Button>
          </div>
        }
      />
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {packagingTypes.map((pkg) => (
            <Card key={pkg.id} className="border-l-4 border-l-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{pkg.name}</p>
                  <p className="text-3xl font-bold text-gray-900">{pkg.total_balance}</p>
                  <p className="text-sm text-gray-500">Depósito: R$ {pkg.deposit_value.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Balances by Location */}
        <Card title="Saldos por Local">
          <Table
            columns={[
              {
                key: 'packaging',
                header: 'Embalagem',
                render: (b) => b.packaging.name,
              },
              {
                key: 'location',
                header: 'Local',
                render: (b) => b.store?.name || b.supplier?.name || '-',
              },
              {
                key: 'type',
                header: 'Tipo',
                render: (b) => b.store ? 'Loja' : 'Fornecedor',
              },
              {
                key: 'balance',
                header: 'Saldo',
                render: (b) => (
                  <span className={b.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {b.balance >= 0 ? '+' : ''}{b.balance}
                  </span>
                ),
              },
            ]}
            data={balances}
          />
        </Card>
      </div>
    </>
  );
}
