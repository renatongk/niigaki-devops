import { z } from 'zod';

export const createEmbalagemSchema = z.object({
  descricao: z.string().min(1).max(255),
  valor_deposito: z.number().min(0).optional().default(0),
  unidade_medida: z.string().max(10).optional().default('un'),
  ativo: z.boolean().optional().default(true),
});

export const updateEmbalagemSchema = z.object({
  descricao: z.string().min(1).max(255).optional(),
  valor_deposito: z.number().min(0).optional(),
  unidade_medida: z.string().max(10).optional(),
  ativo: z.boolean().optional(),
});

export type CreateEmbalagemInput = z.infer<typeof createEmbalagemSchema>;
export type UpdateEmbalagemInput = z.infer<typeof updateEmbalagemSchema>;
