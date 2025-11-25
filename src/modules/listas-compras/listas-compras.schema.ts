import { z } from 'zod';

const prioridadeEnum = z.enum(['baixa', 'normal', 'alta', 'urgente']);

export const createListaComprasSchema = z.object({
  loja_id: z.string().uuid(),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    produto_id: z.string().uuid(),
    quantidade_sugerida: z.number().min(0),
    quantidade_estoque_atual: z.number().min(0).optional().default(0),
    prioridade: prioridadeEnum.optional().default('normal'),
    observacoes: z.string().optional(),
  })).optional().default([]),
});

export const updateListaComprasSchema = z.object({
  observacoes: z.string().optional(),
});

export const addItemSchema = z.object({
  produto_id: z.string().uuid(),
  quantidade_sugerida: z.number().min(0),
  quantidade_estoque_atual: z.number().min(0).optional().default(0),
  prioridade: prioridadeEnum.optional().default('normal'),
  observacoes: z.string().optional(),
});

export type CreateListaComprasInput = z.infer<typeof createListaComprasSchema>;
export type UpdateListaComprasInput = z.infer<typeof updateListaComprasSchema>;
export type AddItemInput = z.infer<typeof addItemSchema>;
