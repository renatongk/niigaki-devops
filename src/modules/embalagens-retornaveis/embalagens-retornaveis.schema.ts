import { z } from 'zod';

export const ajusteMovimentoSchema = z.object({
  loja_id: z.string().uuid(),
  embalagem_id: z.string().uuid(),
  tipo: z.enum(['entrada', 'saida', 'ajuste']),
  quantidade: z.number().int(),
  valor_deposito_total: z.number().min(0).optional().default(0),
  observacoes: z.string().optional(),
});

export type AjusteMovimentoInput = z.infer<typeof ajusteMovimentoSchema>;
