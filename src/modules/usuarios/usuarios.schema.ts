import { z } from 'zod';

const roleEnum = z.enum([
  'tenant_owner',
  'gestor',
  'comprador',
  'operador_loja',
  'financeiro',
  'auditor',
  'suporte_saas',
]);

export const createUsuarioSchema = z.object({
  nome: z.string().min(1).max(255),
  telefone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(6),
  roles: z.array(roleEnum).optional().default([]),
  lojas_permitidas: z.array(z.string().uuid()).optional().default([]),
  atributos_json: z.object({
    lojas_permitidas: z.array(z.string().uuid()).optional().default([]),
    perfil_financeiro: z.boolean().optional().default(false),
    perfil_compras: z.boolean().optional().default(false),
    perfil_auditoria: z.boolean().optional().default(false),
  }).optional(),
  ativo: z.boolean().optional().default(true),
});

export const updateUsuarioSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  telefone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  senha: z.string().min(6).optional(),
  ativo: z.boolean().optional(),
});

export const updateRolesSchema = z.object({
  roles: z.array(roleEnum),
});

export const updateLojasSchema = z.object({
  lojas_permitidas: z.array(z.string().uuid()),
});

export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>;
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>;
export type UpdateRolesInput = z.infer<typeof updateRolesSchema>;
export type UpdateLojasInput = z.infer<typeof updateLojasSchema>;
