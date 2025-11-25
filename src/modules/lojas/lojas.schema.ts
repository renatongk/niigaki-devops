import { z } from 'zod';

export const createLojaSchema = z.object({
  nome: z.string().min(1).max(255),
  codigo_interno: z.string().min(1).max(50),
  documento: z.string().max(20).optional(),
  endereco: z.string().optional(),
  ativo: z.boolean().optional().default(true),
});

export const updateLojaSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  codigo_interno: z.string().min(1).max(50).optional(),
  documento: z.string().max(20).optional(),
  endereco: z.string().optional(),
  ativo: z.boolean().optional(),
});

export type CreateLojaInput = z.infer<typeof createLojaSchema>;
export type UpdateLojaInput = z.infer<typeof updateLojaSchema>;
