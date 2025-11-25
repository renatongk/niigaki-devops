'use client';

import { useState } from 'react';
import { Header } from '@/components/layout';
import { Card } from '@/components/ui';

interface FinancialSummary {
  income: number;
  expense: number;
  balance: number;
}

export default function FinancialPage() {
  const [summary] = useState<FinancialSummary>({
    income: 45000.00,
    expense: 32500.00,
    balance: 12500.00,
  });

  const [transactions] = useState([
    { id: '1', date: '2024-01-15', type: 'expense', category: 'purchase', description: 'Compra CEASA - Fornecedor A', amount: 2500.00 },
    { id: '2', date: '2024-01-15', type: 'income', category: 'sale', description: 'Venda Loja Centro', amount: 5000.00 },
    { id: '3', date: '2024-01-14', type: 'expense', category: 'purchase', description: 'Compra CEASA - Fornecedor B', amount: 1850.00 },
    { id: '4', date: '2024-01-14', type: 'income', category: 'sale', description: 'Venda Loja Norte', amount: 3500.00 },
  ]);

  return (
    <>
      <Header
        title="Financeiro"
        subtitle="Controle de receitas e despesas"
      />
      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <p className="text-sm text-gray-500">Receitas</p>
            <p className="text-3xl font-bold text-green-600">
              R$ {summary.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <p className="text-sm text-gray-500">Despesas</p>
            <p className="text-3xl font-bold text-red-600">
              R$ {summary.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <p className="text-sm text-gray-500">Saldo</p>
            <p className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </Card>
        </div>

        {/* Transactions */}
        <Card title="Últimas Transações">
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <svg className={`w-5 h-5 ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                        tx.type === 'income' ? 'M12 4v16m8-8H4' : 'M20 12H4'
                      } />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{tx.description}</p>
                    <p className="text-sm text-gray-500">{new Date(tx.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <p className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'income' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
