import { z } from 'zod';

const tratamentoEnum = z.enum(['credito', 'troca', 'estorno']);

export const createDevolucaoSchema = z.object({
  loja_id: z.string().uuid(),
  romaneio_id: z.string().uuid().optional(),
  motivo: z.string().min(1),
  tratamento: tratamentoEnum.optional().default('credito'),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    produto_id: z.string().uuid(),
    quantidade: z.number().min(0),
    motivo_especifico: z.string().optional(),
    valor_unitario: z.number().min(0),
  })).min(1),
});

export type CreateDevolucaoInput = z.infer<typeof createDevolucaoSchema>;
