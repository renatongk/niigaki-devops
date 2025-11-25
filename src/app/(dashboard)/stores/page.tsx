'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, Table, Badge } from '@/components/ui';

interface Store {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  is_active: boolean;
}

export default function StoresPage() {
  const [stores] = useState<Store[]>([
    { id: '1', name: 'Loja Centro', code: 'LC01', address: 'Rua Principal, 100', phone: '(11) 1234-5678', is_active: true },
    { id: '2', name: 'Loja Norte', code: 'LN01', address: 'Av. Norte, 200', phone: '(11) 2345-6789', is_active: true },
    { id: '3', name: 'Loja Sul', code: 'LS01', address: 'Rua Sul, 300', phone: '(11) 3456-7890', is_active: false },
  ]);

  return (
    <>
      <Header
        title="Lojas"
        subtitle="Gerencie as lojas da sua rede"
        actions={
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Loja
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <Table
            columns={[
              { key: 'code', header: 'Código' },
              { key: 'name', header: 'Nome' },
              { key: 'address', header: 'Endereço' },
              { key: 'phone', header: 'Telefone' },
              {
                key: 'is_active',
                header: 'Status',
                render: (store) => (
                  <Badge variant={store.is_active ? 'success' : 'danger'}>
                    {store.is_active ? 'Ativa' : 'Inativa'}
                  </Badge>
                ),
              },
            ]}
            data={stores}
            onRowClick={(store) => console.log('Clicked store:', store)}
          />
        </Card>
      </div>
    </>
  );
}
