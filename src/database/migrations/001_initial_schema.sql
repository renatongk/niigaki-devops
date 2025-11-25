-- Ceasa SaaS Database Schema
-- Multi-tenant architecture with RLS (Row Level Security)

-- ============================================================================
-- Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Helper function for RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- Tenants Table
-- ============================================================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  documento VARCHAR(20) NOT NULL UNIQUE,
  configuracoes_json JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Lojas (Stores) Table
-- ============================================================================
CREATE TABLE lojas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  codigo_interno VARCHAR(50) NOT NULL,
  documento VARCHAR(20),
  endereco TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, codigo_interno)
);

CREATE INDEX idx_lojas_tenant_id ON lojas(tenant_id);

ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
CREATE POLICY lojas_tenant_isolation ON lojas
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Usuarios (Users) Table
-- ============================================================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  senha_hash VARCHAR(255) NOT NULL,
  roles TEXT[] DEFAULT '{}',
  lojas_permitidas UUID[] DEFAULT '{}',
  atributos_json JSONB DEFAULT '{"lojas_permitidas":[],"perfil_financeiro":false,"perfil_compras":false,"perfil_auditoria":false}',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email),
  UNIQUE(tenant_id, telefone)
);

CREATE INDEX idx_usuarios_tenant_id ON usuarios(tenant_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_telefone ON usuarios(telefone);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY usuarios_tenant_isolation ON usuarios
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Fornecedores (Suppliers) Table
-- ============================================================================
CREATE TABLE fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  documento VARCHAR(20),
  contatos_json JSONB DEFAULT '[]',
  endereco TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fornecedores_tenant_id ON fornecedores(tenant_id);

ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY fornecedores_tenant_isolation ON fornecedores
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Categorias Table
-- ============================================================================
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, nome)
);

CREATE INDEX idx_categorias_tenant_id ON categorias(tenant_id);

ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY categorias_tenant_isolation ON categorias
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Produtos Table
-- ============================================================================
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  unidade_medida VARCHAR(10) NOT NULL DEFAULT 'un',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_produtos_tenant_id ON produtos(tenant_id);
CREATE INDEX idx_produtos_categoria_id ON produtos(categoria_id);

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY produtos_tenant_isolation ON produtos
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Embalagens Table
-- ============================================================================
CREATE TABLE embalagens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  descricao VARCHAR(255) NOT NULL,
  valor_deposito DECIMAL(10, 2) DEFAULT 0,
  unidade_medida VARCHAR(10) NOT NULL DEFAULT 'un',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_embalagens_tenant_id ON embalagens(tenant_id);

ALTER TABLE embalagens ENABLE ROW LEVEL SECURITY;
CREATE POLICY embalagens_tenant_isolation ON embalagens
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Listas de Compras (Shopping Lists) Table
-- ============================================================================
CREATE TABLE listas_compras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'rascunho',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT listas_compras_status_check CHECK (status IN ('rascunho', 'enviada', 'processada', 'cancelada'))
);

CREATE INDEX idx_listas_compras_tenant_id ON listas_compras(tenant_id);
CREATE INDEX idx_listas_compras_loja_id ON listas_compras(loja_id);
CREATE INDEX idx_listas_compras_status ON listas_compras(status);

ALTER TABLE listas_compras ENABLE ROW LEVEL SECURITY;
CREATE POLICY listas_compras_tenant_isolation ON listas_compras
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Listas de Compras Itens Table
-- ============================================================================
CREATE TABLE listas_compras_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lista_compras_id UUID NOT NULL REFERENCES listas_compras(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  quantidade_sugerida DECIMAL(10, 3) NOT NULL DEFAULT 0,
  quantidade_estoque_atual DECIMAL(10, 3) DEFAULT 0,
  prioridade VARCHAR(20) NOT NULL DEFAULT 'normal',
  observacoes TEXT,
  CONSTRAINT listas_compras_itens_prioridade_check CHECK (prioridade IN ('baixa', 'normal', 'alta', 'urgente'))
);

CREATE INDEX idx_listas_compras_itens_lista_id ON listas_compras_itens(lista_compras_id);
CREATE INDEX idx_listas_compras_itens_produto_id ON listas_compras_itens(produto_id);

-- ============================================================================
-- Compras (Purchases) Table
-- ============================================================================
CREATE TABLE compras (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE RESTRICT,
  comprador_user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  data_compra TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valor_total DECIMAL(12, 2) DEFAULT 0,
  descontos DECIMAL(10, 2) DEFAULT 0,
  acrescimos DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  metodo_pagamento VARCHAR(20) DEFAULT 'prazo',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT compras_status_check CHECK (status IN ('pendente', 'concluida', 'cancelada')),
  CONSTRAINT compras_metodo_pagamento_check CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'boleto', 'cartao', 'transferencia', 'prazo'))
);

CREATE INDEX idx_compras_tenant_id ON compras(tenant_id);
CREATE INDEX idx_compras_fornecedor_id ON compras(fornecedor_id);
CREATE INDEX idx_compras_comprador_user_id ON compras(comprador_user_id);
CREATE INDEX idx_compras_status ON compras(status);
CREATE INDEX idx_compras_data_compra ON compras(data_compra);

ALTER TABLE compras ENABLE ROW LEVEL SECURITY;
CREATE POLICY compras_tenant_isolation ON compras
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Compras Itens Table
-- ============================================================================
CREATE TABLE compras_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  compra_id UUID NOT NULL REFERENCES compras(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade_total DECIMAL(10, 3) NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  unidade_medida VARCHAR(10) NOT NULL DEFAULT 'un',
  embalagem_id UUID REFERENCES embalagens(id) ON DELETE SET NULL,
  quantidade_embalagens INTEGER DEFAULT 0,
  valor_deposito_total DECIMAL(10, 2) DEFAULT 0
);

CREATE INDEX idx_compras_itens_compra_id ON compras_itens(compra_id);
CREATE INDEX idx_compras_itens_produto_id ON compras_itens(produto_id);

-- ============================================================================
-- Romaneios Table
-- ============================================================================
CREATE TABLE romaneios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data_romaneio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) NOT NULL DEFAULT 'rascunho',
  comprador_user_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT romaneios_status_check CHECK (status IN ('rascunho', 'finalizado', 'cancelado'))
);

CREATE INDEX idx_romaneios_tenant_id ON romaneios(tenant_id);
CREATE INDEX idx_romaneios_comprador_user_id ON romaneios(comprador_user_id);
CREATE INDEX idx_romaneios_status ON romaneios(status);
CREATE INDEX idx_romaneios_data ON romaneios(data_romaneio);

ALTER TABLE romaneios ENABLE ROW LEVEL SECURITY;
CREATE POLICY romaneios_tenant_isolation ON romaneios
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Romaneios Itens Table
-- ============================================================================
CREATE TABLE romaneios_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  romaneio_id UUID NOT NULL REFERENCES romaneios(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  compra_item_id UUID REFERENCES compras_itens(id) ON DELETE SET NULL,
  quantidade DECIMAL(10, 3) NOT NULL,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  valor_total DECIMAL(12, 2) NOT NULL,
  embalagem_id UUID REFERENCES embalagens(id) ON DELETE SET NULL,
  quantidade_embalagens INTEGER DEFAULT 0,
  valor_deposito_total DECIMAL(10, 2) DEFAULT 0
);

CREATE INDEX idx_romaneios_itens_romaneio_id ON romaneios_itens(romaneio_id);
CREATE INDEX idx_romaneios_itens_loja_id ON romaneios_itens(loja_id);
CREATE INDEX idx_romaneios_itens_produto_id ON romaneios_itens(produto_id);

-- ============================================================================
-- Títulos Loja -> Comprador Table
-- ============================================================================
CREATE TABLE titulos_loja_comprador (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL DEFAULT 'receber',
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE RESTRICT,
  romaneio_id UUID REFERENCES romaneios(id) ON DELETE SET NULL,
  valor_principal DECIMAL(12, 2) NOT NULL,
  valor_depositos DECIMAL(10, 2) DEFAULT 0,
  valor_total DECIMAL(12, 2) NOT NULL,
  data_emissao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT titulos_lc_tipo_check CHECK (tipo IN ('receber', 'pagar')),
  CONSTRAINT titulos_lc_status_check CHECK (status IN ('aberto', 'parcial', 'pago', 'cancelado'))
);

CREATE INDEX idx_titulos_lc_tenant_id ON titulos_loja_comprador(tenant_id);
CREATE INDEX idx_titulos_lc_loja_id ON titulos_loja_comprador(loja_id);
CREATE INDEX idx_titulos_lc_romaneio_id ON titulos_loja_comprador(romaneio_id);
CREATE INDEX idx_titulos_lc_status ON titulos_loja_comprador(status);
CREATE INDEX idx_titulos_lc_vencimento ON titulos_loja_comprador(data_vencimento);

ALTER TABLE titulos_loja_comprador ENABLE ROW LEVEL SECURITY;
CREATE POLICY titulos_lc_tenant_isolation ON titulos_loja_comprador
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Títulos Comprador -> Fornecedor Table
-- ============================================================================
CREATE TABLE titulos_comprador_fornecedor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tipo VARCHAR(10) NOT NULL DEFAULT 'pagar',
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE RESTRICT,
  compra_id UUID REFERENCES compras(id) ON DELETE SET NULL,
  valor_principal DECIMAL(12, 2) NOT NULL,
  data_emissao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT titulos_cf_tipo_check CHECK (tipo IN ('receber', 'pagar')),
  CONSTRAINT titulos_cf_status_check CHECK (status IN ('aberto', 'parcial', 'pago', 'cancelado'))
);

CREATE INDEX idx_titulos_cf_tenant_id ON titulos_comprador_fornecedor(tenant_id);
CREATE INDEX idx_titulos_cf_fornecedor_id ON titulos_comprador_fornecedor(fornecedor_id);
CREATE INDEX idx_titulos_cf_compra_id ON titulos_comprador_fornecedor(compra_id);
CREATE INDEX idx_titulos_cf_status ON titulos_comprador_fornecedor(status);
CREATE INDEX idx_titulos_cf_vencimento ON titulos_comprador_fornecedor(data_vencimento);

ALTER TABLE titulos_comprador_fornecedor ENABLE ROW LEVEL SECURITY;
CREATE POLICY titulos_cf_tenant_isolation ON titulos_comprador_fornecedor
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Embalagens Saldos Table
-- ============================================================================
CREATE TABLE embalagens_saldos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  embalagem_id UUID NOT NULL REFERENCES embalagens(id) ON DELETE CASCADE,
  saldo_quantidade INTEGER DEFAULT 0,
  saldo_deposito DECIMAL(10, 2) DEFAULT 0,
  UNIQUE(tenant_id, loja_id, embalagem_id)
);

CREATE INDEX idx_embalagens_saldos_tenant_id ON embalagens_saldos(tenant_id);
CREATE INDEX idx_embalagens_saldos_loja_id ON embalagens_saldos(loja_id);

ALTER TABLE embalagens_saldos ENABLE ROW LEVEL SECURITY;
CREATE POLICY embalagens_saldos_tenant_isolation ON embalagens_saldos
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Embalagens Movimentos Table
-- ============================================================================
CREATE TABLE embalagens_movimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  embalagem_id UUID NOT NULL REFERENCES embalagens(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL,
  quantidade INTEGER NOT NULL,
  valor_deposito_total DECIMAL(10, 2) DEFAULT 0,
  referencia_tipo VARCHAR(20) NOT NULL,
  referencia_id UUID,
  data_movimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT emb_mov_tipo_check CHECK (tipo IN ('entrada', 'saida', 'ajuste')),
  CONSTRAINT emb_mov_ref_tipo_check CHECK (referencia_tipo IN ('romaneio', 'devolucao', 'ajuste_manual'))
);

CREATE INDEX idx_embalagens_mov_tenant_id ON embalagens_movimentos(tenant_id);
CREATE INDEX idx_embalagens_mov_loja_id ON embalagens_movimentos(loja_id);
CREATE INDEX idx_embalagens_mov_embalagem_id ON embalagens_movimentos(embalagem_id);
CREATE INDEX idx_embalagens_mov_data ON embalagens_movimentos(data_movimento);

ALTER TABLE embalagens_movimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY embalagens_mov_tenant_isolation ON embalagens_movimentos
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Devoluções Table
-- ============================================================================
CREATE TABLE devolucoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  loja_id UUID NOT NULL REFERENCES lojas(id) ON DELETE CASCADE,
  romaneio_id UUID REFERENCES romaneios(id) ON DELETE SET NULL,
  data_devolucao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  motivo TEXT NOT NULL,
  tratamento VARCHAR(20) NOT NULL DEFAULT 'credito',
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT devolucoes_tratamento_check CHECK (tratamento IN ('credito', 'troca', 'estorno')),
  CONSTRAINT devolucoes_status_check CHECK (status IN ('pendente', 'processada', 'cancelada'))
);

CREATE INDEX idx_devolucoes_tenant_id ON devolucoes(tenant_id);
CREATE INDEX idx_devolucoes_loja_id ON devolucoes(loja_id);
CREATE INDEX idx_devolucoes_romaneio_id ON devolucoes(romaneio_id);
CREATE INDEX idx_devolucoes_status ON devolucoes(status);
CREATE INDEX idx_devolucoes_data ON devolucoes(data_devolucao);

ALTER TABLE devolucoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY devolucoes_tenant_isolation ON devolucoes
  USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Devoluções Itens Table
-- ============================================================================
CREATE TABLE devolucoes_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  devolucao_id UUID NOT NULL REFERENCES devolucoes(id) ON DELETE CASCADE,
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE RESTRICT,
  quantidade DECIMAL(10, 3) NOT NULL,
  motivo_especifico TEXT,
  valor_unitario DECIMAL(10, 2) NOT NULL,
  valor_total DECIMAL(12, 2) NOT NULL
);

CREATE INDEX idx_devolucoes_itens_devolucao_id ON devolucoes_itens(devolucao_id);
CREATE INDEX idx_devolucoes_itens_produto_id ON devolucoes_itens(produto_id);

-- ============================================================================
-- Audit Logs Table
-- ============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  user_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT audit_logs_action_check CHECK (action IN ('create', 'update', 'delete', 'login', 'logout', 'action'))
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- Trigger function for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lojas_updated_at BEFORE UPDATE ON lojas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON fornecedores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_embalagens_updated_at BEFORE UPDATE ON embalagens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listas_compras_updated_at BEFORE UPDATE ON listas_compras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_compras_updated_at BEFORE UPDATE ON compras FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_romaneios_updated_at BEFORE UPDATE ON romaneios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_titulos_lc_updated_at BEFORE UPDATE ON titulos_loja_comprador FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_titulos_cf_updated_at BEFORE UPDATE ON titulos_comprador_fornecedor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_devolucoes_updated_at BEFORE UPDATE ON devolucoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
