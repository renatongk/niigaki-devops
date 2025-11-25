// Type definitions for the Ceasa SaaS system

// ============================================================================
// Base Types
// ============================================================================

export type UUID = string;
export type Timestamp = Date;

// ============================================================================
// Tenant
// ============================================================================

export interface Tenant {
  id: UUID;
  nome: string;
  documento: string;
  configuracoes_json: Record<string, unknown>;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// Loja (Store)
// ============================================================================

export interface Loja {
  id: UUID;
  tenant_id: UUID;
  nome: string;
  codigo_interno: string;
  documento: string;
  endereco: string;
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// Usuario (User)
// ============================================================================

export type Role = 
  | 'tenant_owner'
  | 'gestor'
  | 'comprador'
  | 'operador_loja'
  | 'financeiro'
  | 'auditor'
  | 'suporte_saas';

export interface UserAttributes {
  lojas_permitidas: UUID[];
  perfil_financeiro: boolean;
  perfil_compras: boolean;
  perfil_auditoria: boolean;
}

export interface Usuario {
  id: UUID;
  tenant_id: UUID;
  nome: string;
  telefone: string;
  email: string;
  senha_hash: string;
  roles: Role[];
  lojas_permitidas: UUID[];
  atributos_json: UserAttributes;
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// Fornecedor (Supplier)
// ============================================================================

export interface FornecedorContato {
  tipo: 'telefone' | 'email' | 'whatsapp';
  valor: string;
}

export interface Fornecedor {
  id: UUID;
  tenant_id: UUID;
  nome: string;
  documento: string;
  contatos_json: FornecedorContato[];
  endereco: string;
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// Categoria
// ============================================================================

export interface Categoria {
  id: UUID;
  tenant_id: UUID;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// Produto
// ============================================================================

export type UnidadeMedida = 'kg' | 'un' | 'cx' | 'dz' | 'mc' | 'lt';

export interface Produto {
  id: UUID;
  tenant_id: UUID;
  categoria_id: UUID;
  nome: string;
  descricao: string;
  unidade_medida: UnidadeMedida;
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// Embalagem
// ============================================================================

export interface Embalagem {
  id: UUID;
  tenant_id: UUID;
  descricao: string;
  valor_deposito: number;
  unidade_medida: string;
  ativo: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// Lista de Compras (Shopping List)
// ============================================================================

export type ListaComprasStatus = 'rascunho' | 'enviada' | 'processada' | 'cancelada';

export interface ListaCompras {
  id: UUID;
  tenant_id: UUID;
  loja_id: UUID;
  status: ListaComprasStatus;
  observacoes: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export type Prioridade = 'baixa' | 'normal' | 'alta' | 'urgente';

export interface ListaComprasItem {
  id: UUID;
  lista_compras_id: UUID;
  produto_id: UUID;
  quantidade_sugerida: number;
  quantidade_estoque_atual: number;
  prioridade: Prioridade;
  observacoes: string;
}

// ============================================================================
// Compra (Purchase)
// ============================================================================

export type CompraStatus = 'pendente' | 'concluida' | 'cancelada';
export type MetodoPagamento = 'dinheiro' | 'pix' | 'boleto' | 'cartao' | 'transferencia' | 'prazo';

export interface Compra {
  id: UUID;
  tenant_id: UUID;
  fornecedor_id: UUID;
  comprador_user_id: UUID;
  data_compra: Timestamp;
  valor_total: number;
  descontos: number;
  acrescimos: number;
  status: CompraStatus;
  metodo_pagamento: MetodoPagamento;
  observacoes: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface CompraItem {
  id: UUID;
  compra_id: UUID;
  produto_id: UUID;
  quantidade_total: number;
  preco_unitario: number;
  unidade_medida: UnidadeMedida;
  embalagem_id?: UUID;
  quantidade_embalagens: number;
  valor_deposito_total: number;
}

// ============================================================================
// Romaneio
// ============================================================================

export type RomaneioStatus = 'rascunho' | 'finalizado' | 'cancelado';

export interface Romaneio {
  id: UUID;
  tenant_id: UUID;
  data_romaneio: Timestamp;
  status: RomaneioStatus;
  comprador_user_id: UUID;
  observacoes: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface RomaneioItem {
  id: UUID;
  romaneio_id: UUID;
  loja_id: UUID;
  produto_id: UUID;
  compra_item_id?: UUID;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  embalagem_id?: UUID;
  quantidade_embalagens: number;
  valor_deposito_total: number;
}

// ============================================================================
// Financeiro (Financial)
// ============================================================================

export type TituloTipo = 'receber' | 'pagar';
export type TituloStatus = 'aberto' | 'parcial' | 'pago' | 'cancelado';

export interface TituloLojaComprador {
  id: UUID;
  tenant_id: UUID;
  tipo: TituloTipo;
  loja_id: UUID;
  romaneio_id: UUID;
  valor_principal: number;
  valor_depositos: number;
  valor_total: number;
  data_emissao: Timestamp;
  data_vencimento: Timestamp;
  status: TituloStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface TituloCompradorFornecedor {
  id: UUID;
  tenant_id: UUID;
  tipo: TituloTipo;
  fornecedor_id: UUID;
  compra_id: UUID;
  valor_principal: number;
  data_emissao: Timestamp;
  data_vencimento: Timestamp;
  status: TituloStatus;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// ============================================================================
// Embalagens Retornáveis
// ============================================================================

export interface EmbalagemSaldo {
  id: UUID;
  tenant_id: UUID;
  loja_id: UUID;
  embalagem_id: UUID;
  saldo_quantidade: number;
  saldo_deposito: number;
}

export type MovimentoTipo = 'entrada' | 'saida' | 'ajuste';
export type ReferenciaTipo = 'romaneio' | 'devolucao' | 'ajuste_manual';

export interface EmbalagemMovimento {
  id: UUID;
  tenant_id: UUID;
  loja_id: UUID;
  embalagem_id: UUID;
  tipo: MovimentoTipo;
  quantidade: number;
  valor_deposito_total: number;
  referencia_tipo: ReferenciaTipo;
  referencia_id: UUID;
  data_movimento: Timestamp;
}

// ============================================================================
// Devoluções (Returns)
// ============================================================================

export type TratamentoDevolucao = 'credito' | 'troca' | 'estorno';
export type DevolucaoStatus = 'pendente' | 'processada' | 'cancelada';

export interface Devolucao {
  id: UUID;
  tenant_id: UUID;
  loja_id: UUID;
  romaneio_id?: UUID;
  data_devolucao: Timestamp;
  motivo: string;
  tratamento: TratamentoDevolucao;
  status: DevolucaoStatus;
  observacoes: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DevolucaoItem {
  id: UUID;
  devolucao_id: UUID;
  produto_id: UUID;
  quantidade: number;
  motivo_especifico: string;
  valor_unitario: number;
  valor_total: number;
}

// ============================================================================
// Logs
// ============================================================================

export type LogAction = 'create' | 'update' | 'delete' | 'login' | 'logout' | 'action';

export interface AuditLog {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID;
  action: LogAction;
  entity_type: string;
  entity_id?: UUID;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: Timestamp;
}

// ============================================================================
// JWT Payload
// ============================================================================

export interface JWTPayload {
  user_id: UUID;
  tenant_id: UUID;
  lojas_permitidas: UUID[];
  roles: Role[];
  atributos: UserAttributes;
}

// ============================================================================
// API Request Types
// ============================================================================

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
