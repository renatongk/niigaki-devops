import { query, getClientWithTenant } from '../../database/connection';
import { NotFoundError, ValidationError } from '../../middleware';
import { Usuario } from '../../types';
import { paginate, formatPaginationResponse, hashPassword } from '../../utils';
import { CreateUsuarioInput, UpdateUsuarioInput, UpdateRolesInput, UpdateLojasInput } from './usuarios.schema';

interface ListUsuariosOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  ativo?: boolean;
}

type UsuarioWithoutPassword = Omit<Usuario, 'senha_hash'>;

export async function listUsuarios(options: ListUsuariosOptions) {
  const { tenantId, page = 1, limit = 20, ativo } = options;
  const { offset, limit: safeLimit } = paginate(page, limit);

  const conditions: string[] = ['tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (ativo !== undefined) {
    conditions.push(`ativo = $${paramIndex++}`);
    values.push(ativo);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM usuarios WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<Usuario>(
    `SELECT id, tenant_id, nome, telefone, email, roles, lojas_permitidas, atributos_json, ativo, created_at, updated_at
     FROM usuarios WHERE ${whereClause} ORDER BY nome LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function getUsuario(tenantId: string, id: string): Promise<UsuarioWithoutPassword> {
  const result = await query<Usuario>(
    `SELECT id, tenant_id, nome, telefone, email, roles, lojas_permitidas, atributos_json, ativo, created_at, updated_at
     FROM usuarios WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Usuário não encontrado');
  }

  return result.rows[0];
}

export async function createUsuario(tenantId: string, input: CreateUsuarioInput): Promise<UsuarioWithoutPassword> {
  // Check for unique email/phone
  if (input.email) {
    const emailCheck = await query(
      `SELECT id FROM usuarios WHERE email = $1 AND tenant_id = $2`,
      [input.email, tenantId]
    );
    if (emailCheck.rows.length > 0) {
      throw new ValidationError('Email já está em uso');
    }
  }

  if (input.telefone) {
    const phoneCheck = await query(
      `SELECT id FROM usuarios WHERE telefone = $1 AND tenant_id = $2`,
      [input.telefone, tenantId]
    );
    if (phoneCheck.rows.length > 0) {
      throw new ValidationError('Telefone já está em uso');
    }
  }

  const senha_hash = await hashPassword(input.senha);
  
  const atributos = input.atributos_json || {
    lojas_permitidas: input.lojas_permitidas || [],
    perfil_financeiro: false,
    perfil_compras: false,
    perfil_auditoria: false,
  };

  const result = await query<Usuario>(
    `INSERT INTO usuarios (tenant_id, nome, telefone, email, senha_hash, roles, lojas_permitidas, atributos_json, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, tenant_id, nome, telefone, email, roles, lojas_permitidas, atributos_json, ativo, created_at, updated_at`,
    [
      tenantId,
      input.nome,
      input.telefone,
      input.email,
      senha_hash,
      input.roles,
      input.lojas_permitidas,
      JSON.stringify(atributos),
      input.ativo,
    ]
  );

  return result.rows[0];
}

export async function updateUsuario(
  tenantId: string,
  id: string,
  input: UpdateUsuarioInput
): Promise<UsuarioWithoutPassword> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.nome !== undefined) {
    updates.push(`nome = $${paramIndex++}`);
    values.push(input.nome);
  }

  if (input.telefone !== undefined) {
    // Check unique
    const check = await query(
      `SELECT id FROM usuarios WHERE telefone = $1 AND tenant_id = $2 AND id != $3`,
      [input.telefone, tenantId, id]
    );
    if (check.rows.length > 0) {
      throw new ValidationError('Telefone já está em uso');
    }
    updates.push(`telefone = $${paramIndex++}`);
    values.push(input.telefone);
  }

  if (input.email !== undefined) {
    // Check unique
    const check = await query(
      `SELECT id FROM usuarios WHERE email = $1 AND tenant_id = $2 AND id != $3`,
      [input.email, tenantId, id]
    );
    if (check.rows.length > 0) {
      throw new ValidationError('Email já está em uso');
    }
    updates.push(`email = $${paramIndex++}`);
    values.push(input.email);
  }

  if (input.senha !== undefined) {
    const senha_hash = await hashPassword(input.senha);
    updates.push(`senha_hash = $${paramIndex++}`);
    values.push(senha_hash);
  }

  if (input.ativo !== undefined) {
    updates.push(`ativo = $${paramIndex++}`);
    values.push(input.ativo);
  }

  if (updates.length === 0) {
    return getUsuario(tenantId, id);
  }

  values.push(id, tenantId);

  const result = await query<Usuario>(
    `UPDATE usuarios SET ${updates.join(', ')} 
     WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex} 
     RETURNING id, tenant_id, nome, telefone, email, roles, lojas_permitidas, atributos_json, ativo, created_at, updated_at`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Usuário não encontrado');
  }

  return result.rows[0];
}

export async function deleteUsuario(tenantId: string, id: string): Promise<void> {
  const client = await getClientWithTenant(tenantId);

  try {
    const result = await client.query(
      `DELETE FROM usuarios WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Usuário não encontrado');
    }
  } finally {
    client.release();
  }
}

export async function updateRoles(
  tenantId: string,
  id: string,
  input: UpdateRolesInput
): Promise<UsuarioWithoutPassword> {
  const result = await query<Usuario>(
    `UPDATE usuarios SET roles = $1 
     WHERE id = $2 AND tenant_id = $3 
     RETURNING id, tenant_id, nome, telefone, email, roles, lojas_permitidas, atributos_json, ativo, created_at, updated_at`,
    [input.roles, id, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Usuário não encontrado');
  }

  return result.rows[0];
}

export async function updateLojas(
  tenantId: string,
  id: string,
  input: UpdateLojasInput
): Promise<UsuarioWithoutPassword> {
  const result = await query<Usuario>(
    `UPDATE usuarios SET lojas_permitidas = $1,
     atributos_json = jsonb_set(atributos_json, '{lojas_permitidas}', $2::jsonb)
     WHERE id = $3 AND tenant_id = $4 
     RETURNING id, tenant_id, nome, telefone, email, roles, lojas_permitidas, atributos_json, ativo, created_at, updated_at`,
    [input.lojas_permitidas, JSON.stringify(input.lojas_permitidas), id, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Usuário não encontrado');
  }

  return result.rows[0];
}
