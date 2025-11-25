import { z } from 'zod';

export const loginSchema = z.object({
  identificador: z.string().min(1, 'Identificador é obrigatório'),
  senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const refreshTokenSchema = z.object({
  refresh_token: z.string().min(1, 'Refresh token é obrigatório'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
