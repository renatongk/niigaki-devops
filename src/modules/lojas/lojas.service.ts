import { query, getClientWithTenant } from '../../database/connection';
import { NotFoundError } from '../../middleware';
import { Loja } from '../../types';
import { paginate, formatPaginationResponse } from '../../utils';
import { CreateLojaInput, UpdateLojaInput } from './lojas.schema';

interface ListLojasOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  ativo?: boolean;
  lojasPermitidas?: string[];
}

export async function listLojas(options: ListLojasOptions) {
  const { tenantId, page = 1, limit = 20, ativo, lojasPermitidas } = options;
  const { offset, limit: safeLimit } = paginate(page, limit);

  const conditions: string[] = ['tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (ativo !== undefined) {
    conditions.push(`ativo = $${paramIndex++}`);
    values.push(ativo);
  }

  if (lojasPermitidas && lojasPermitidas.length > 0) {
    conditions.push(`id = ANY($${paramIndex++})`);
    values.push(lojasPermitidas);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM lojas WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<Loja>(
    `SELECT * FROM lojas WHERE ${whereClause} ORDER BY nome LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function getLoja(tenantId: string, id: string): Promise<Loja> {
  const result = await query<Loja>(
    `SELECT * FROM lojas WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Loja não encontrada');
  }

  return result.rows[0];
}

export async function createLoja(tenantId: string, input: CreateLojaInput): Promise<Loja> {
  const result = await query<Loja>(
    `INSERT INTO lojas (tenant_id, nome, codigo_interno, documento, endereco, ativo)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tenantId, input.nome, input.codigo_interno, input.documento, input.endereco, input.ativo]
  );

  return result.rows[0];
}

export async function updateLoja(tenantId: string, id: string, input: UpdateLojaInput): Promise<Loja> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.nome !== undefined) {
    updates.push(`nome = $${paramIndex++}`);
    values.push(input.nome);
  }

  if (input.codigo_interno !== undefined) {
    updates.push(`codigo_interno = $${paramIndex++}`);
    values.push(input.codigo_interno);
  }

  if (input.documento !== undefined) {
    updates.push(`documento = $${paramIndex++}`);
    values.push(input.documento);
  }

  if (input.endereco !== undefined) {
    updates.push(`endereco = $${paramIndex++}`);
    values.push(input.endereco);
  }

  if (input.ativo !== undefined) {
    updates.push(`ativo = $${paramIndex++}`);
    values.push(input.ativo);
  }

  if (updates.length === 0) {
    return getLoja(tenantId, id);
  }

  values.push(id, tenantId);

  const result = await query<Loja>(
    `UPDATE lojas SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Loja não encontrada');
  }

  return result.rows[0];
}

export async function deleteLoja(tenantId: string, id: string): Promise<void> {
  const client = await getClientWithTenant(tenantId);
  
  try {
    const result = await client.query(
      `DELETE FROM lojas WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Loja não encontrada');
    }
  } finally {
    client.release();
  }
}
