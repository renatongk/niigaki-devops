import { query, getClientWithTenant } from '../../database/connection';
import { NotFoundError } from '../../middleware';
import { Categoria } from '../../types';
import { paginate, formatPaginationResponse } from '../../utils';
import { CreateCategoriaInput, UpdateCategoriaInput } from './categorias.schema';

interface ListOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  ativo?: boolean;
}

export async function list(options: ListOptions) {
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
    `SELECT COUNT(*) as count FROM categorias WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<Categoria>(
    `SELECT * FROM categorias WHERE ${whereClause} ORDER BY nome LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function getById(tenantId: string, id: string): Promise<Categoria> {
  const result = await query<Categoria>(
    `SELECT * FROM categorias WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Categoria não encontrada');
  }

  return result.rows[0];
}

export async function create(tenantId: string, input: CreateCategoriaInput): Promise<Categoria> {
  const result = await query<Categoria>(
    `INSERT INTO categorias (tenant_id, nome, descricao, ativo)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [tenantId, input.nome, input.descricao, input.ativo]
  );

  return result.rows[0];
}

export async function update(tenantId: string, id: string, input: UpdateCategoriaInput): Promise<Categoria> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.nome !== undefined) {
    updates.push(`nome = $${paramIndex++}`);
    values.push(input.nome);
  }

  if (input.descricao !== undefined) {
    updates.push(`descricao = $${paramIndex++}`);
    values.push(input.descricao);
  }

  if (input.ativo !== undefined) {
    updates.push(`ativo = $${paramIndex++}`);
    values.push(input.ativo);
  }

  if (updates.length === 0) {
    return getById(tenantId, id);
  }

  values.push(id, tenantId);

  const result = await query<Categoria>(
    `UPDATE categorias SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Categoria não encontrada');
  }

  return result.rows[0];
}

export async function remove(tenantId: string, id: string): Promise<void> {
  const client = await getClientWithTenant(tenantId);

  try {
    const result = await client.query(
      `DELETE FROM categorias WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Categoria não encontrada');
    }
  } finally {
    client.release();
  }
}
