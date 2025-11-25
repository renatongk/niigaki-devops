'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, Table } from '@/components/ui';

interface Supplier {
  id: string;
  name: string;
  document: string;
  phone?: string;
  pix_key?: string;
}

export default function SuppliersPage() {
  const [suppliers] = useState<Supplier[]>([
    { id: '1', name: 'Fornecedor A', document: '00.000.000/0001-00', phone: '(11) 1234-5678', pix_key: 'fornecedor.a@email.com' },
    { id: '2', name: 'Fornecedor B', document: '11.111.111/0001-11', phone: '(11) 2345-6789', pix_key: '11111111111' },
    { id: '3', name: 'Fornecedor C', document: '22.222.222/0001-22', phone: '(11) 3456-7890' },
  ]);

  return (
    <>
      <Header
        title="Fornecedores"
        subtitle="Gerencie os fornecedores do CEASA"
        actions={
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo Fornecedor
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <Table
            columns={[
              { key: 'name', header: 'Nome' },
              { key: 'document', header: 'CNPJ/CPF' },
              { key: 'phone', header: 'Telefone', render: (s) => s.phone || '-' },
              { key: 'pix_key', header: 'Chave PIX', render: (s) => s.pix_key || '-' },
            ]}
            data={suppliers}
          />
        </Card>
      </div>
    </>
  );
}
