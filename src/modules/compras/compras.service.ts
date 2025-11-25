import { query, transaction } from '../../database/connection';
import { NotFoundError, ValidationError } from '../../middleware';
import { Compra, CompraItem } from '../../types';
import { paginate, formatPaginationResponse } from '../../utils';
import { CreateCompraInput, UpdateCompraInput } from './compras.schema';

interface ListOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  fornecedor_id?: string;
  status?: string;
  comprador_user_id?: string;
}

interface CompraWithItems extends Compra {
  itens: CompraItem[];
}

export async function list(options: ListOptions) {
  const { tenantId, page = 1, limit = 20, fornecedor_id, status, comprador_user_id } = options;
  const { offset, limit: safeLimit } = paginate(page, limit);

  const conditions: string[] = ['tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (fornecedor_id) {
    conditions.push(`fornecedor_id = $${paramIndex++}`);
    values.push(fornecedor_id);
  }

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (comprador_user_id) {
    conditions.push(`comprador_user_id = $${paramIndex++}`);
    values.push(comprador_user_id);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM compras WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<Compra>(
    `SELECT * FROM compras WHERE ${whereClause} ORDER BY data_compra DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function getById(tenantId: string, id: string): Promise<CompraWithItems> {
  const result = await query<Compra>(
    `SELECT * FROM compras WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Compra não encontrada');
  }

  const compra = result.rows[0];

  const itensResult = await query<CompraItem>(
    `SELECT ci.*, p.nome as produto_nome 
     FROM compras_itens ci
     JOIN produtos p ON p.id = ci.produto_id
     WHERE compra_id = $1`,
    [id]
  );

  return {
    ...compra,
    itens: itensResult.rows,
  };
}

export async function create(tenantId: string, compradorUserId: string, input: CreateCompraInput): Promise<CompraWithItems> {
  return transaction(async (client) => {
    // Calculate total
    let valorTotal = input.itens.reduce((sum, item) => {
      return sum + (item.quantidade_total * item.preco_unitario) + (item.valor_deposito_total || 0);
    }, 0);

    valorTotal = valorTotal - (input.descontos || 0) + (input.acrescimos || 0);

    const result = await client.query(
      `INSERT INTO compras (tenant_id, fornecedor_id, comprador_user_id, data_compra, valor_total, descontos, acrescimos, status, metodo_pagamento, observacoes)
       VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()), $5, $6, $7, 'pendente', $8, $9)
       RETURNING *`,
      [
        tenantId,
        input.fornecedor_id,
        compradorUserId,
        input.data_compra,
        valorTotal,
        input.descontos || 0,
        input.acrescimos || 0,
        input.metodo_pagamento,
        input.observacoes,
      ]
    );

    const compra = result.rows[0] as Compra;

    // Insert items
    const itens: CompraItem[] = [];
    for (const item of input.itens) {
      const itemResult = await client.query(
        `INSERT INTO compras_itens (compra_id, produto_id, quantidade_total, preco_unitario, unidade_medida, embalagem_id, quantidade_embalagens, valor_deposito_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          compra.id,
          item.produto_id,
          item.quantidade_total,
          item.preco_unitario,
          item.unidade_medida,
          item.embalagem_id,
          item.quantidade_embalagens || 0,
          item.valor_deposito_total || 0,
        ]
      );
      itens.push(itemResult.rows[0] as CompraItem);
    }

    return { ...compra, itens };
  });
}

export async function update(tenantId: string, id: string, input: UpdateCompraInput): Promise<CompraWithItems> {
  const existing = await getById(tenantId, id);
  if (existing.status !== 'pendente') {
    throw new ValidationError('Apenas compras pendentes podem ser editadas');
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.descontos !== undefined) {
    updates.push(`descontos = $${paramIndex++}`);
    values.push(input.descontos);
  }

  if (input.acrescimos !== undefined) {
    updates.push(`acrescimos = $${paramIndex++}`);
    values.push(input.acrescimos);
  }

  if (input.metodo_pagamento !== undefined) {
    updates.push(`metodo_pagamento = $${paramIndex++}`);
    values.push(input.metodo_pagamento);
  }

  if (input.observacoes !== undefined) {
    updates.push(`observacoes = $${paramIndex++}`);
    values.push(input.observacoes);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id, tenantId);

  await query(
    `UPDATE compras SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}`,
    values
  );

  return getById(tenantId, id);
}

export async function concluir(tenantId: string, id: string): Promise<CompraWithItems> {
  const compra = await getById(tenantId, id);
  if (compra.status !== 'pendente') {
    throw new ValidationError('Apenas compras pendentes podem ser concluídas');
  }

  return transaction(async (client) => {
    // Update status
    await client.query(
      `UPDATE compras SET status = 'concluida' WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    // Create financial title (comprador -> fornecedor)
    await client.query(
      `INSERT INTO titulos_comprador_fornecedor (tenant_id, tipo, fornecedor_id, compra_id, valor_principal, data_vencimento)
       VALUES ($1, 'pagar', $2, $3, $4, NOW() + INTERVAL '30 days')`,
      [tenantId, compra.fornecedor_id, id, compra.valor_total]
    );

    return getById(tenantId, id);
  });
}

export async function cancelar(tenantId: string, id: string): Promise<CompraWithItems> {
  const compra = await getById(tenantId, id);
  if (compra.status !== 'pendente') {
    throw new ValidationError('Apenas compras pendentes podem ser canceladas');
  }

  await query(
    `UPDATE compras SET status = 'cancelada' WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  return getById(tenantId, id);
}
