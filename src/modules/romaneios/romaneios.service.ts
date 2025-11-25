import { query, transaction } from '../../database/connection';
import { NotFoundError, ValidationError } from '../../middleware';
import { Romaneio, RomaneioItem } from '../../types';
import { paginate, formatPaginationResponse } from '../../utils';
import { GerarRomaneioInput, UpdateRomaneioInput } from './romaneios.schema';

interface ListOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  status?: string;
  comprador_user_id?: string;
}

interface RomaneioWithItems extends Romaneio {
  itens: RomaneioItem[];
}

export async function list(options: ListOptions) {
  const { tenantId, page = 1, limit = 20, status, comprador_user_id } = options;
  const { offset, limit: safeLimit } = paginate(page, limit);

  const conditions: string[] = ['tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

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
    `SELECT COUNT(*) as count FROM romaneios WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<Romaneio>(
    `SELECT * FROM romaneios WHERE ${whereClause} ORDER BY data_romaneio DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function getById(tenantId: string, id: string): Promise<RomaneioWithItems> {
  const result = await query<Romaneio>(
    `SELECT * FROM romaneios WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Romaneio não encontrado');
  }

  const romaneio = result.rows[0];

  const itensResult = await query<RomaneioItem>(
    `SELECT ri.*, p.nome as produto_nome, l.nome as loja_nome
     FROM romaneios_itens ri
     JOIN produtos p ON p.id = ri.produto_id
     JOIN lojas l ON l.id = ri.loja_id
     WHERE romaneio_id = $1`,
    [id]
  );

  return {
    ...romaneio,
    itens: itensResult.rows,
  };
}

export async function gerar(tenantId: string, compradorUserId: string, input: GerarRomaneioInput): Promise<RomaneioWithItems> {
  return transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO romaneios (tenant_id, data_romaneio, status, comprador_user_id, observacoes)
       VALUES ($1, COALESCE($2::timestamptz, NOW()), 'rascunho', $3, $4)
       RETURNING *`,
      [tenantId, input.data_romaneio, compradorUserId, input.observacoes]
    );

    const romaneio = result.rows[0] as Romaneio;

    // Insert items
    const itens: RomaneioItem[] = [];
    for (const item of input.itens) {
      const valorTotal = item.quantidade * item.preco_unitario + (item.valor_deposito_total || 0);
      
      const itemResult = await client.query(
        `INSERT INTO romaneios_itens (romaneio_id, loja_id, produto_id, compra_item_id, quantidade, preco_unitario, valor_total, embalagem_id, quantidade_embalagens, valor_deposito_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          romaneio.id,
          item.loja_id,
          item.produto_id,
          item.compra_item_id,
          item.quantidade,
          item.preco_unitario,
          valorTotal,
          item.embalagem_id,
          item.quantidade_embalagens || 0,
          item.valor_deposito_total || 0,
        ]
      );
      itens.push(itemResult.rows[0] as RomaneioItem);
    }

    return { ...romaneio, itens };
  });
}

export async function update(tenantId: string, id: string, input: UpdateRomaneioInput): Promise<RomaneioWithItems> {
  const existing = await getById(tenantId, id);
  if (existing.status !== 'rascunho') {
    throw new ValidationError('Apenas romaneios em rascunho podem ser editados');
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
    `UPDATE romaneios SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND tenant_id = $${paramIndex}`,
    values
  );

  return getById(tenantId, id);
}

export async function finalizar(tenantId: string, id: string): Promise<RomaneioWithItems> {
  const romaneio = await getById(tenantId, id);
  if (romaneio.status !== 'rascunho') {
    throw new ValidationError('Apenas romaneios em rascunho podem ser finalizados');
  }

  return transaction(async (client) => {
    // Update status
    await client.query(
      `UPDATE romaneios SET status = 'finalizado' WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    // Group items by loja to create financial titles
    const lojaValues = new Map<string, { valor_principal: number; valor_depositos: number }>();
    
    for (const item of romaneio.itens) {
      const current = lojaValues.get(item.loja_id) || { valor_principal: 0, valor_depositos: 0 };
      current.valor_principal += item.quantidade * item.preco_unitario;
      current.valor_depositos += item.valor_deposito_total;
      lojaValues.set(item.loja_id, current);
    }

    // Create financial titles for each store
    for (const [lojaId, values] of lojaValues) {
      const valorTotal = values.valor_principal + values.valor_depositos;
      
      await client.query(
        `INSERT INTO titulos_loja_comprador (tenant_id, tipo, loja_id, romaneio_id, valor_principal, valor_depositos, valor_total, data_vencimento)
         VALUES ($1, 'receber', $2, $3, $4, $5, $6, NOW() + INTERVAL '30 days')`,
        [tenantId, lojaId, id, values.valor_principal, values.valor_depositos, valorTotal]
      );

      // Create packaging movements (saida)
      const embalagemItems = romaneio.itens.filter(i => i.loja_id === lojaId && i.embalagem_id && i.quantidade_embalagens > 0);
      
      for (const item of embalagemItems) {
        // Update or insert balance
        await client.query(
          `INSERT INTO embalagens_saldos (tenant_id, loja_id, embalagem_id, saldo_quantidade, saldo_deposito)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (tenant_id, loja_id, embalagem_id)
           DO UPDATE SET 
             saldo_quantidade = embalagens_saldos.saldo_quantidade + EXCLUDED.saldo_quantidade,
             saldo_deposito = embalagens_saldos.saldo_deposito + EXCLUDED.saldo_deposito`,
          [tenantId, lojaId, item.embalagem_id, item.quantidade_embalagens, item.valor_deposito_total]
        );

        // Create movement record
        await client.query(
          `INSERT INTO embalagens_movimentos (tenant_id, loja_id, embalagem_id, tipo, quantidade, valor_deposito_total, referencia_tipo, referencia_id)
           VALUES ($1, $2, $3, 'saida', $4, $5, 'romaneio', $6)`,
          [tenantId, lojaId, item.embalagem_id, item.quantidade_embalagens, item.valor_deposito_total, id]
        );
      }
    }

    return getById(tenantId, id);
  });
}

export async function cancelar(tenantId: string, id: string): Promise<RomaneioWithItems> {
  const romaneio = await getById(tenantId, id);
  if (romaneio.status !== 'rascunho') {
    throw new ValidationError('Apenas romaneios em rascunho podem ser cancelados');
  }

  await query(
    `UPDATE romaneios SET status = 'cancelado' WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  return getById(tenantId, id);
}
