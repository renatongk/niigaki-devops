import { query, getClientWithTenant } from '../../database/connection';
import { NotFoundError } from '../../middleware';
import { Embalagem } from '../../types';
import { paginate, formatPaginationResponse } from '../../utils';
import { CreateEmbalagemInput, UpdateEmbalagemInput } from './embalagens.schema';

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
    `SELECT COUNT(*) as count FROM embalagens WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<Embalagem>(
    `SELECT * FROM embalagens WHERE ${whereClause} ORDER BY descricao LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function getById(tenantId: string, id: string): Promise<Embalagem> {
  const result = await query<Embalagem>(
    `SELECT * FROM embalagens WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Embalagem não encontrada');
  }

  return result.rows[0];
}

export async function create(tenantId: string, input: CreateEmbalagemInput): Promise<Embalagem> {
  const result = await query<Embalagem>(
    `INSERT INTO embalagens (tenant_id, descricao, valor_deposito, unidade_medida, ativo)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [tenantId, input.descricao, input.valor_deposito, input.unidade_medida, input.ativo]
  );

  return result.rows[0];
}

export async function update(tenantId: string, id: string, input: UpdateEmbalagemInput): Promise<Embalagem> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.descricao !== undefined) {
    updates.push(`descricao = $${paramIndex++}`);
    values.push(input.descricao);
  }

  if (input.valor_deposito !== undefined) {
    updates.push(`valor_deposito = $${paramIndex++}`);
    values.push(input.valor_deposito);
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

  const result = await query<Embalagem>(
    `UPDATE embalagens SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Embalagem não encontrada');
  }

  return result.rows[0];
}

export async function remove(tenantId: string, id: string): Promise<void> {
  const client = await getClientWithTenant(tenantId);

  try {
    const result = await client.query(
      `DELETE FROM embalagens WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Embalagem não encontrada');
    }
  } finally {
    client.release();
  }
}
