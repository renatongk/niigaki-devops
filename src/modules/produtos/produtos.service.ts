import { query, getClientWithTenant } from '../../database/connection';
import { NotFoundError } from '../../middleware';
import { Produto } from '../../types';
import { paginate, formatPaginationResponse } from '../../utils';
import { CreateProdutoInput, UpdateProdutoInput } from './produtos.schema';

interface ListOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  ativo?: boolean;
  categoria_id?: string;
}

export async function list(options: ListOptions) {
  const { tenantId, page = 1, limit = 20, ativo, categoria_id } = options;
  const { offset, limit: safeLimit } = paginate(page, limit);

  const conditions: string[] = ['tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (ativo !== undefined) {
    conditions.push(`ativo = $${paramIndex++}`);
    values.push(ativo);
  }

  if (categoria_id) {
    conditions.push(`categoria_id = $${paramIndex++}`);
    values.push(categoria_id);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM produtos WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<Produto>(
    `SELECT * FROM produtos WHERE ${whereClause} ORDER BY nome LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function getById(tenantId: string, id: string): Promise<Produto> {
  const result = await query<Produto>(
    `SELECT * FROM produtos WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Produto não encontrado');
  }

  return result.rows[0];
}

export async function create(tenantId: string, input: CreateProdutoInput): Promise<Produto> {
  const result = await query<Produto>(
    `INSERT INTO produtos (tenant_id, categoria_id, nome, descricao, unidade_medida, ativo)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tenantId, input.categoria_id, input.nome, input.descricao, input.unidade_medida, input.ativo]
  );

  return result.rows[0];
}

export async function update(tenantId: string, id: string, input: UpdateProdutoInput): Promise<Produto> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.categoria_id !== undefined) {
    updates.push(`categoria_id = $${paramIndex++}`);
    values.push(input.categoria_id);
  }

  if (input.nome !== undefined) {
    updates.push(`nome = $${paramIndex++}`);
    values.push(input.nome);
  }

  if (input.descricao !== undefined) {
    updates.push(`descricao = $${paramIndex++}`);
    values.push(input.descricao);
  }

  if (input.unidade_medida !== undefined) {
    updates.push(`unidade_medida = $${paramIndex++}`);
    values.push(input.unidade_medida);
  }

  if (input.ativo !== undefined) {
    updates.push(`ativo = $${paramIndex++}`);
    values.push(input.ativo);
  }

  if (updates.length === 0) {
    return getById(tenantId, id);
  }

  values.push(id, tenantId);

  const result = await query<Produto>(
    `UPDATE produtos SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Produto não encontrado');
  }

  return result.rows[0];
}

export async function remove(tenantId: string, id: string): Promise<void> {
  const client = await getClientWithTenant(tenantId);

  try {
    const result = await client.query(
      `DELETE FROM produtos WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Produto não encontrado');
    }
  } finally {
    client.release();
  }
}
