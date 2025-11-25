'use client';

import { Header } from '@/components/layout';
import { Card, Button } from '@/components/ui';

export default function SettingsPage() {
  return (
    <>
      <Header
        title="Configurações"
        subtitle="Gerencie as configurações da sua conta"
      />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Info */}
          <Card title="Informações da Empresa">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  defaultValue="Minha Empresa Ltda"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  defaultValue="00.000.000/0001-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  defaultValue="contato@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                  defaultValue="(11) 1234-5678"
                />
              </div>
              <Button>Salvar Alterações</Button>
            </div>
          </Card>

          {/* Subscription */}
          <Card title="Assinatura">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">Plano Profissional</p>
                    <p className="text-sm text-green-600">Ativo</p>
                  </div>
                  <p className="text-2xl font-bold text-green-800">R$ 199,90/mês</p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>• Até 10 lojas</p>
                <p>• Até 20 usuários</p>
                <p>• Financeiro completo</p>
                <p>• Devoluções</p>
                <p>• Embalagens retornáveis</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">Alterar Plano</Button>
                <Button variant="outline">Gerenciar Pagamento</Button>
              </div>
            </div>
          </Card>

          {/* Security */}
          <Card title="Segurança">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
              <Button>Alterar Senha</Button>
            </div>
          </Card>

          {/* Notifications */}
          <Card title="Notificações">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">E-mail de novos pedidos</p>
                  <p className="text-sm text-gray-500">Receba um e-mail quando uma loja criar um pedido</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">E-mail de pagamentos</p>
                  <p className="text-sm text-gray-500">Receba um e-mail sobre vencimentos de pagamentos</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5 rounded border-gray-300 text-green-600" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Resumo diário</p>
                  <p className="text-sm text-gray-500">Receba um resumo diário das operações</p>
                </div>
                <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-green-600" />
              </div>
              <Button>Salvar Preferências</Button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
