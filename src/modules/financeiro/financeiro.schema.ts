import { z } from 'zod';

export const baixarTituloSchema = z.object({
  valor_pago: z.number().min(0).optional(),
  data_pagamento: z.string().datetime().optional(),
  observacoes: z.string().optional(),
});

export type BaixarTituloInput = z.infer<typeof baixarTituloSchema>;
