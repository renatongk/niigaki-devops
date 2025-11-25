import { z } from 'zod';

export const updateTenantSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  documento: z.string().min(11).max(20).optional(),
  configuracoes_json: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
