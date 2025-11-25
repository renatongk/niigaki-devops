import { z } from 'zod';

const unidadeMedidaEnum = z.enum(['kg', 'un', 'cx', 'dz', 'mc', 'lt']);

export const createProdutoSchema = z.object({
  categoria_id: z.string().uuid().optional(),
  nome: z.string().min(1).max(255),
  descricao: z.string().optional(),
  unidade_medida: unidadeMedidaEnum.optional().default('un'),
  ativo: z.boolean().optional().default(true),
});

export const updateProdutoSchema = z.object({
  categoria_id: z.string().uuid().optional().nullable(),
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().optional(),
  unidade_medida: unidadeMedidaEnum.optional(),
  ativo: z.boolean().optional(),
});

export type CreateProdutoInput = z.infer<typeof createProdutoSchema>;
export type UpdateProdutoInput = z.infer<typeof updateProdutoSchema>;
