import { z } from 'zod';

export const gerarRomaneioSchema = z.object({
  data_romaneio: z.string().datetime().optional(),
  observacoes: z.string().optional(),
  itens: z.array(z.object({
    loja_id: z.string().uuid(),
    produto_id: z.string().uuid(),
    compra_item_id: z.string().uuid().optional(),
    quantidade: z.number().min(0),
    preco_unitario: z.number().min(0),
    embalagem_id: z.string().uuid().optional(),
    quantidade_embalagens: z.number().int().min(0).optional().default(0),
    valor_deposito_total: z.number().min(0).optional().default(0),
  })).min(1),
});

export const updateRomaneioSchema = z.object({
  observacoes: z.string().optional(),
});

export type GerarRomaneioInput = z.infer<typeof gerarRomaneioSchema>;
export type UpdateRomaneioInput = z.infer<typeof updateRomaneioSchema>;
