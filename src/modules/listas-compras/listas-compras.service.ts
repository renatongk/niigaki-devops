import { query, transaction } from '../../database/connection';
import { NotFoundError, ValidationError } from '../../middleware';
import { ListaCompras, ListaComprasItem } from '../../types';
import { paginate, formatPaginationResponse } from '../../utils';
import { CreateListaComprasInput, UpdateListaComprasInput, AddItemInput } from './listas-compras.schema';

interface ListOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  loja_id?: string;
  status?: string;
  lojasPermitidas?: string[];
}

interface ListaWithItems extends ListaCompras {
  itens: ListaComprasItem[];
}

export async function list(options: ListOptions) {
  const { tenantId, page = 1, limit = 20, loja_id, status, lojasPermitidas } = options;
  const { offset, limit: safeLimit } = paginate(page, limit);

  const conditions: string[] = ['tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (loja_id) {
    conditions.push(`loja_id = $${paramIndex++}`);
    values.push(loja_id);
  }

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (lojasPermitidas && lojasPermitidas.length > 0) {
    conditions.push(`loja_id = ANY($${paramIndex++})`);
    values.push(lojasPermitidas);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM listas_compras WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<ListaCompras>(
    `SELECT * FROM listas_compras WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function getById(tenantId: string, id: string): Promise<ListaWithItems> {
  const result = await query<ListaCompras>(
    `SELECT * FROM listas_compras WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Lista de compras não encontrada');
  }

  const lista = result.rows[0];

  const itensResult = await query<ListaComprasItem>(
    `SELECT lci.*, p.nome as produto_nome 
     FROM listas_compras_itens lci
     JOIN produtos p ON p.id = lci.produto_id
     WHERE lista_compras_id = $1`,
    [id]
  );

  return {
    ...lista,
    itens: itensResult.rows,
  };
}

export async function create(tenantId: string, input: CreateListaComprasInput): Promise<ListaWithItems> {
  return transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO listas_compras (tenant_id, loja_id, status, observacoes)
       VALUES ($1, $2, 'rascunho', $3)
       RETURNING *`,
      [tenantId, input.loja_id, input.observacoes]
    );

    const lista = result.rows[0] as ListaCompras;

    // Insert items
    const itens: ListaComprasItem[] = [];
    for (const item of input.itens || []) {
      const itemResult = await client.query(
        `INSERT INTO listas_compras_itens (lista_compras_id, produto_id, quantidade_sugerida, quantidade_estoque_atual, prioridade, observacoes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [lista.id, item.produto_id, item.quantidade_sugerida, item.quantidade_estoque_atual, item.prioridade, item.observacoes]
      );
      itens.push(itemResult.rows[0] as ListaComprasItem);
    }

    return { ...lista, itens };
  });
}

export async function update(tenantId: string, id: string, input: UpdateListaComprasInput): Promise<ListaWithItems> {
  // Check if lista exists and is in rascunho status
  const existing = await getById(tenantId, id);
  if (existing.status !== 'rascunho') {
    throw new ValidationError('Apenas listas em rascunho podem ser editadas');
  }

  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.observacoes !== undefined) {
    updates.push(`observacoes = $${paramIndex++}`);
    values.push(input.observacoes);
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(id, tenantId);

  await query(
    `UPDATE listas_compras SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}`,
    values
  );

  return getById(tenantId, id);
}

export async function addItem(tenantId: string, listaId: string, input: AddItemInput): Promise<ListaComprasItem> {
  const lista = await getById(tenantId, listaId);
  if (lista.status !== 'rascunho') {
    throw new ValidationError('Apenas listas em rascunho podem receber itens');
  }

  const result = await query<ListaComprasItem>(
    `INSERT INTO listas_compras_itens (lista_compras_id, produto_id, quantidade_sugerida, quantidade_estoque_atual, prioridade, observacoes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [listaId, input.produto_id, input.quantidade_sugerida, input.quantidade_estoque_atual, input.prioridade, input.observacoes]
  );

  return result.rows[0];
}

export async function enviar(tenantId: string, id: string): Promise<ListaWithItems> {
  const lista = await getById(tenantId, id);
  if (lista.status !== 'rascunho') {
    throw new ValidationError('Apenas listas em rascunho podem ser enviadas');
  }

  if (lista.itens.length === 0) {
    throw new ValidationError('Lista precisa ter pelo menos um item');
  }

  await query(
    `UPDATE listas_compras SET status = 'enviada' WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  return getById(tenantId, id);
}

export async function cancelar(tenantId: string, id: string): Promise<ListaWithItems> {
  const lista = await getById(tenantId, id);
  if (!['rascunho', 'enviada'].includes(lista.status)) {
    throw new ValidationError('Apenas listas em rascunho ou enviadas podem ser canceladas');
  }

  await query(
    `UPDATE listas_compras SET status = 'cancelada' WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  return getById(tenantId, id);
}
