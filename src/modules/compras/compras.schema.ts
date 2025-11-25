import { z } from 'zod';

const metodoPagamentoEnum = z.enum(['dinheiro', 'pix', 'boleto', 'cartao', 'transferencia', 'prazo']);
const unidadeMedidaEnum = z.enum(['kg', 'un', 'cx', 'dz', 'mc', 'lt']);

export const createCompraSchema = z.object({
  fornecedor_id: z.string().uuid(),
  data_compra: z.string().datetime().optional(),
  descontos: z.number().min(0).optional().default(0),
  acrescimos: z.number().min(0).optional().default(0),
  metodo_pagamento: metodoPagamentoEnum.optional().default('prazo'),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    produto_id: z.string().uuid(),
    quantidade_total: z.number().min(0),
    preco_unitario: z.number().min(0),
    unidade_medida: unidadeMedidaEnum.optional().default('un'),
    embalagem_id: z.string().uuid().optional(),
    quantidade_embalagens: z.number().int().min(0).optional().default(0),
    valor_deposito_total: z.number().min(0).optional().default(0),
  })).min(1),
});

export const updateCompraSchema = z.object({
  descontos: z.number().min(0).optional(),
  acrescimos: z.number().min(0).optional(),
  metodo_pagamento: metodoPagamentoEnum.optional(),
  observacoes: z.string().optional(),
});

export type CreateCompraInput = z.infer<typeof createCompraSchema>;
export type UpdateCompraInput = z.infer<typeof updateCompraSchema>;
