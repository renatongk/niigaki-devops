'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Button, Card, Table, Badge } from '@/components/ui';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'buyer' | 'store_operator';
  store?: { name: string };
  is_active: boolean;
}

const roleLabels = {
  admin: 'Administrador',
  manager: 'Gerente',
  buyer: 'Comprador',
  store_operator: 'Operador',
};

export default function UsersPage() {
  const [users] = useState<User[]>([
    { id: '1', name: 'João Silva', email: 'joao@empresa.com', role: 'admin', is_active: true },
    { id: '2', name: 'Maria Santos', email: 'maria@empresa.com', role: 'buyer', is_active: true },
    { id: '3', name: 'Carlos Lima', email: 'carlos@empresa.com', role: 'store_operator', store: { name: 'Loja Centro' }, is_active: true },
  ]);

  return (
    <>
      <Header
        title="Usuários"
        subtitle="Gerencie os usuários do sistema"
        actions={
          <Button>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Convidar Usuário
          </Button>
        }
      />
      <div className="p-6">
        <Card>
          <Table
            columns={[
              { key: 'name', header: 'Nome' },
              { key: 'email', header: 'E-mail' },
              {
                key: 'role',
                header: 'Função',
                render: (user) => roleLabels[user.role],
              },
              {
                key: 'store',
                header: 'Loja',
                render: (user) => user.store?.name || '-',
              },
              {
                key: 'is_active',
                header: 'Status',
                render: (user) => (
                  <Badge variant={user.is_active ? 'success' : 'danger'}>
                    {user.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                ),
              },
            ]}
            data={users}
          />
        </Card>
      </div>
    </>
  );
}
