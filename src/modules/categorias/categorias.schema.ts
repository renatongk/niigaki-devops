import { z } from 'zod';

export const createCategoriaSchema = z.object({
  nome: z.string().min(1).max(255),
  descricao: z.string().optional(),
  ativo: z.boolean().optional().default(true),
});

export const updateCategoriaSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().optional(),
  ativo: z.boolean().optional(),
});

export type CreateCategoriaInput = z.infer<typeof createCategoriaSchema>;
export type UpdateCategoriaInput = z.infer<typeof updateCategoriaSchema>;
