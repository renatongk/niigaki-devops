import { z } from 'zod';

export const createFornecedorSchema = z.object({
  nome: z.string().min(1).max(255),
  documento: z.string().max(20).optional(),
  contatos_json: z.array(z.object({
    tipo: z.enum(['telefone', 'email', 'whatsapp']),
    valor: z.string(),
  })).optional().default([]),
  endereco: z.string().optional(),
  ativo: z.boolean().optional().default(true),
});

export const updateFornecedorSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  documento: z.string().max(20).optional(),
  contatos_json: z.array(z.object({
    tipo: z.enum(['telefone', 'email', 'whatsapp']),
    valor: z.string(),
  })).optional(),
  endereco: z.string().optional(),
  ativo: z.boolean().optional(),
});

export type CreateFornecedorInput = z.infer<typeof createFornecedorSchema>;
export type UpdateFornecedorInput = z.infer<typeof updateFornecedorSchema>;
