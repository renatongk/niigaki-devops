# CEASA SaaS - Sistema Multi-Tenant de Controle de Compras

Sistema SaaS multi-tenant para controle de compras do CEASA (Central de Abastecimento), com gestão de lojas, pedidos, estoque, distribuição, financeiro, devoluções e embalagens retornáveis.

## 🚀 Funcionalidades

### Multi-tenant
- Cada cliente (tenant) possui dados completamente isolados
- Suporte a múltiplas lojas por tenant
- Controle de usuários com diferentes funções (admin, gerente, comprador, operador)

### Gestão de Pedidos
- Lojas criam listas de pedidos com itens necessários
- Aprovação de pedidos antes da compra
- Acompanhamento do status do pedido

### Estoque Diário
- Registro do estoque disponível no CEASA
- Visualização por data
- Vinculação com fornecedores

### Compras
- Registro de compras realizadas no CEASA
- Controle de itens comprados
- Gestão de pagamentos a fornecedores

### Distribuição
- Distribuição de compras entre lojas
- Confirmação de recebimento
- Controle de quantidades recebidas

### Financeiro
- Controle de receitas e despesas
- Transações por loja
- Resumo financeiro

### Devoluções
- Registro de devoluções de mercadorias
- Devoluções para fornecedores
- Devoluções de lojas

### Embalagens Retornáveis
- Cadastro de tipos de embalagens
- Movimentação (envio, recebimento, devolução, perda)
- Saldo automático por loja/fornecedor

### Assinaturas
- Integração com Asaas para cobrança
- Planos: Básico, Profissional, Enterprise
- Webhook para atualização de status

## 🛠️ Tecnologias

- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Pagamentos**: Asaas API
- **Segurança**: Row Level Security (RLS)

## 📋 Pré-requisitos

- Node.js 20+
- Conta no Supabase
- Conta no Asaas (para pagamentos)

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/renatongk/niigaki-devops.git
cd niigaki-devops
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Edite o `.env.local` com suas credenciais:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

ASAAS_API_URL=https://sandbox.asaas.com/api/v3
ASAAS_API_KEY=your_asaas_api_key
ASAAS_WEBHOOK_SECRET=your_asaas_webhook_secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Execute as migrações no Supabase:
- Acesse o dashboard do Supabase
- Vá em SQL Editor
- Execute o arquivo `supabase/migrations/20240101000000_initial_schema.sql`

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

7. Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/           # Páginas de autenticação
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/      # Páginas do dashboard
│   │   ├── dashboard/
│   │   ├── stores/
│   │   ├── users/
│   │   ├── products/
│   │   ├── suppliers/
│   │   ├── orders/
│   │   ├── stock/
│   │   ├── purchases/
│   │   ├── distributions/
│   │   ├── financial/
│   │   ├── supplier-payments/
│   │   ├── returns/
│   │   ├── packaging/
│   │   └── settings/
│   └── api/              # API Routes
│       ├── auth/
│       ├── stores/
│       ├── users/
│       ├── products/
│       ├── suppliers/
│       ├── orders/
│       ├── stock/
│       ├── purchases/
│       ├── distributions/
│       ├── financial/
│       ├── supplier-payments/
│       ├── returns/
│       ├── packaging/
│       └── subscriptions/
├── components/
│   ├── layout/           # Componentes de layout
│   └── ui/               # Componentes de UI
├── lib/
│   ├── supabase/         # Cliente Supabase
│   └── asaas.ts          # Cliente Asaas
└── types/
    └── database.ts       # Tipos TypeScript
```

## 🔐 Segurança

O sistema utiliza Row Level Security (RLS) do PostgreSQL para garantir isolamento de dados entre tenants:

- Cada tabela tem políticas que verificam o `tenant_id` do usuário
- Usuários só podem ver/editar dados do seu tenant
- Operações sensíveis são restritas a administradores

## 💳 Planos de Assinatura

| Plano | Preço | Lojas | Usuários | Recursos |
|-------|-------|-------|----------|----------|
| Básico | R$ 99,90/mês | 3 | 5 | Pedidos, Estoque básico |
| Profissional | R$ 199,90/mês | 10 | 20 | + Financeiro, Devoluções, Embalagens |
| Enterprise | R$ 399,90/mês | Ilimitado | Ilimitado | + API, Suporte prioritário |

## 📝 Scripts Disponíveis

```bash
npm run dev      # Inicia servidor de desenvolvimento
npm run build    # Cria build de produção
npm run start    # Inicia servidor de produção
npm run lint     # Executa linter
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.
