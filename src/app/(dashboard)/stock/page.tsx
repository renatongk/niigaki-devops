'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, Table } from '@/components/ui';

interface StockItem {
  id: string;
  product: { name: string; code: string; unit: string };
  supplier?: { name: string };
  available_quantity: number;
  unit_price: number;
}

export default function StockPage() {
  const [stockDate] = useState(new Date().toISOString().split('T')[0]);
  const [stock] = useState<StockItem[]>([
    { id: '1', product: { name: 'Tomate', code: 'TOM01', unit: 'kg' }, supplier: { name: 'Fornecedor A' }, available_quantity: 500, unit_price: 5.50 },
    { id: '2', product: { name: 'Batata', code: 'BAT01', unit: 'kg' }, supplier: { name: 'Fornecedor B' }, available_quantity: 800, unit_price: 3.20 },
    { id: '3', product: { name: 'Cenoura', code: 'CEN01', unit: 'kg' }, supplier: { name: 'Fornecedor A' }, available_quantity: 300, unit_price: 4.80 },
    { id: '4', product: { name: 'Alface', code: 'ALF01', unit: 'un' }, supplier: { name: 'Fornecedor C' }, available_quantity: 200, unit_price: 2.50 },
  ]);

  return (
    <>
      <Header
        title="Estoque Diário"
        subtitle={`Estoque disponível em ${new Date(stockDate).toLocaleDateString('pt-BR')}`}
        actions={
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Adicionar Item
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <Table
            columns={[
              {
                key: 'product',
                header: 'Produto',
                render: (item) => (
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-500">{item.product.code}</p>
                  </div>
                ),
              },
              {
                key: 'supplier',
                header: 'Fornecedor',
                render: (item) => item.supplier?.name || '-',
              },
              {
                key: 'available_quantity',
                header: 'Quantidade',
                render: (item) => `${item.available_quantity} ${item.product.unit}`,
              },
              {
                key: 'unit_price',
                header: 'Preço Unit.',
                render: (item) => `R$ ${item.unit_price.toFixed(2)}`,
              },
            ]}
            data={stock}
          />
        </Card>
      </div>
    </>
  );
}
