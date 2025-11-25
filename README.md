# Ceasa SaaS - Sistema Multi-Tenant para Operações Ceasa/Hortifruti

Sistema SaaS completo para operações de Ceasa e Hortifruti com suporte multi-tenant, controle de compras, romaneio, financeiro e muito mais.

## Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Executando](#executando)
- [API](#api)
- [Autenticação e Autorização](#autenticação-e-autorização)
- [Módulos](#módulos)
- [Testes](#testes)

## Visão Geral

O Ceasa SaaS é uma plataforma completa para gestão de operações de Ceasa/Hortifruti, oferecendo:

- **Multi-Tenant**: Isolamento total de dados por tenant usando Row Level Security (RLS)
- **RBAC + ABAC**: Controle de acesso baseado em papéis e atributos
- **Gestão de Lojas**: Cadastro e gerenciamento de múltiplas lojas por tenant
- **Listas de Compras**: Lojas podem enviar listas de compras para compradores
- **Compras**: Registro de compras de diversos fornecedores
- **Romaneio**: Distribuição de mercadorias para as lojas
- **Financeiro**: Gestão completa de títulos (loja→comprador e comprador→fornecedor)
- **Embalagens Retornáveis**: Controle de depósito e movimentação de embalagens
- **Devoluções**: Sistema de devoluções com crédito, troca ou estorno
- **Relatórios**: Relatórios gerenciais de todas as operações
- **Logs de Auditoria**: Registro completo de todas as ações

## Tecnologias

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **PostgreSQL** - Banco de dados com RLS para multi-tenant
- **JWT** - Autenticação stateless
- **Zod** - Validação de schemas
- **Jest** - Testes unitários

## Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd ceasa-saas

# Instale as dependências
npm install
```

## Configuração

Copie o arquivo de exemplo de variáveis de ambiente:

```bash
cp .env.example .env
```

Configure as variáveis:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ceasa_db

# JWT
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Configuração do Banco de Dados

Execute o script de migração para criar as tabelas:

```bash
psql -U user -d ceasa_db -f src/database/migrations/001_initial_schema.sql
```

## Executando

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## API

Base URL: `/api/v1`

### Endpoints Disponíveis

#### Autenticação
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token

#### Tenants
- `GET /tenants/me` - Dados do tenant atual
- `PUT /tenants/me` - Atualizar tenant

#### Lojas
- `GET /lojas` - Listar lojas
- `POST /lojas` - Criar loja
- `GET /lojas/:id` - Buscar loja
- `PUT /lojas/:id` - Atualizar loja
- `DELETE /lojas/:id` - Remover loja

#### Usuários
- `GET /usuarios` - Listar usuários
- `POST /usuarios` - Criar usuário
- `GET /usuarios/:id` - Buscar usuário
- `PUT /usuarios/:id` - Atualizar usuário
- `DELETE /usuarios/:id` - Remover usuário
- `POST /usuarios/:id/roles` - Atualizar papéis
- `POST /usuarios/:id/lojas` - Atualizar lojas permitidas

#### Cadastros (CRUD)
- `/fornecedores`
- `/categorias`
- `/produtos`
- `/embalagens`

#### Listas de Compras
- `GET /listas-compras` - Listar
- `POST /listas-compras` - Criar
- `GET /listas-compras/:id` - Buscar
- `PUT /listas-compras/:id` - Atualizar
- `POST /listas-compras/:id/enviar` - Enviar lista
- `POST /listas-compras/:id/cancelar` - Cancelar

#### Compras
- `GET /compras` - Listar
- `POST /compras` - Criar
- `GET /compras/:id` - Buscar
- `PUT /compras/:id` - Atualizar
- `POST /compras/:id/concluir` - Concluir
- `POST /compras/:id/cancelar` - Cancelar

#### Romaneio
- `GET /romaneios` - Listar
- `POST /romaneios/gerar` - Gerar romaneio
- `GET /romaneios/:id` - Buscar
- `PUT /romaneios/:id` - Atualizar
- `POST /romaneios/:id/finalizar` - Finalizar
- `POST /romaneios/:id/cancelar` - Cancelar

#### Financeiro
- `GET /financeiro/titulos` - Listar títulos
- `GET /financeiro/titulos/:id` - Buscar título
- `POST /financeiro/titulos/:id/baixar` - Baixar título
- `POST /financeiro/titulos/:id/estornar` - Estornar

#### Embalagens
- `GET /embalagens/saldos` - Saldos por loja
- `GET /embalagens/movimentos` - Movimentações
- `POST /embalagens/movimentos/ajuste` - Ajuste manual

#### Devoluções
- `GET /devolucoes` - Listar
- `POST /devolucoes` - Criar
- `GET /devolucoes/:id` - Buscar
- `POST /devolucoes/:id/processar` - Processar
- `POST /devolucoes/:id/cancelar` - Cancelar

#### Relatórios
- `GET /relatorios/compras`
- `GET /relatorios/romaneios`
- `GET /relatorios/financeiro`
- `GET /relatorios/embalagens`
- `GET /relatorios/devolucoes`

#### Logs
- `GET /logs` - Logs de auditoria

## Autenticação e Autorização

### RBAC (Role-Based Access Control)

Papéis disponíveis:
- `tenant_owner` - Proprietário do tenant (acesso total)
- `gestor` - Gestor (acesso administrativo)
- `comprador` - Comprador (operações de compra e romaneio)
- `operador_loja` - Operador de loja
- `financeiro` - Acesso ao módulo financeiro
- `auditor` - Acesso a relatórios e logs
- `suporte_saas` - Suporte técnico

### ABAC (Attribute-Based Access Control)

Atributos:
- `lojas_permitidas` - Lista de lojas que o usuário pode acessar
- `perfil_financeiro` - Acesso ao módulo financeiro
- `perfil_compras` - Pode registrar compras
- `perfil_auditoria` - Acesso aos logs de auditoria

## Módulos

### 1. Multi-Tenant
- Isolamento total de dados usando RLS do PostgreSQL
- Cada tenant possui configurações próprias

### 2. Listas de Compras
- Lojas criam listas de compras
- Compradores visualizam demanda consolidada

### 3. Compras
- Registro de compras por fornecedor
- Controle de itens, preços e embalagens

### 4. Romaneio
- Distribuição de produtos para lojas
- Geração automática de títulos financeiros
- Movimentação de embalagens

### 5. Financeiro
- Títulos a receber (loja → comprador)
- Títulos a pagar (comprador → fornecedor)
- Baixa manual ou automática

### 6. Embalagens Retornáveis
- Controle de saldo por loja
- Movimentações de entrada/saída
- Valor de depósito

### 7. Devoluções
- Registro de devoluções
- Tratamento: crédito, troca ou estorno
- Ajuste automático no financeiro

## Testes

```bash
# Executar testes
npm test

# Testes em modo watch
npm run test:watch
```

## Estrutura do Projeto

```
src/
├── config/           # Configurações
├── database/         # Conexão e migrações
├── middleware/       # Middlewares (auth, error handling)
├── modules/          # Módulos da aplicação
│   ├── auth/
│   ├── tenants/
│   ├── lojas/
│   ├── usuarios/
│   ├── fornecedores/
│   ├── categorias/
│   ├── produtos/
│   ├── embalagens/
│   ├── listas-compras/
│   ├── compras/
│   ├── romaneios/
│   ├── financeiro/
│   ├── embalagens-retornaveis/
│   ├── devolucoes/
│   ├── relatorios/
│   └── logs/
├── types/            # Definições de tipos
├── utils/            # Utilitários
├── app.ts            # Configuração do Express
└── index.ts          # Ponto de entrada
```

## Licença

ISC
