'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, Table, Badge } from '@/components/ui';

interface Product {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  default_price?: number;
  is_active: boolean;
}

export default function ProductsPage() {
  const [products] = useState<Product[]>([
    { id: '1', name: 'Tomate', code: 'TOM01', category: 'Legumes', unit: 'kg', default_price: 5.50, is_active: true },
    { id: '2', name: 'Batata', code: 'BAT01', category: 'Legumes', unit: 'kg', default_price: 3.20, is_active: true },
    { id: '3', name: 'Cenoura', code: 'CEN01', category: 'Legumes', unit: 'kg', default_price: 4.80, is_active: true },
    { id: '4', name: 'Alface', code: 'ALF01', category: 'Verduras', unit: 'un', default_price: 2.50, is_active: true },
    { id: '5', name: 'Banana', code: 'BAN01', category: 'Frutas', unit: 'kg', default_price: 4.00, is_active: false },
  ]);

  return (
    <>
      <Header
        title="Produtos"
        subtitle="Gerencie o catálogo de produtos"
        actions={
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Produto
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <Table
            columns={[
              { key: 'code', header: 'Código' },
              { key: 'name', header: 'Nome' },
              { key: 'category', header: 'Categoria' },
              { key: 'unit', header: 'Unidade' },
              {
                key: 'default_price',
                header: 'Preço Padrão',
                render: (p) => p.default_price ? `R$ ${p.default_price.toFixed(2)}` : '-',
              },
              {
                key: 'is_active',
                header: 'Status',
                render: (p) => (
                  <Badge variant={p.is_active ? 'success' : 'danger'}>
                    {p.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                ),
              },
            ]}
            data={products}
          />
        </Card>
      </div>
    </>
  );
}
