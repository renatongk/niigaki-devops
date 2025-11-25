import { query, transaction } from '../../database/connection';
import { EmbalagemSaldo, EmbalagemMovimento } from '../../types';
import { paginate, formatPaginationResponse } from '../../utils';
import { AjusteMovimentoInput } from './embalagens-retornaveis.schema';

interface ListSaldosOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  loja_id?: string;
  embalagem_id?: string;
}

interface ListMovimentosOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  loja_id?: string;
  embalagem_id?: string;
  tipo?: string;
}

export async function listSaldos(options: ListSaldosOptions) {
  const { tenantId, page = 1, limit = 20, loja_id, embalagem_id } = options;
  const { offset, limit: safeLimit } = paginate(page, limit);

  const conditions: string[] = ['es.tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (loja_id) {
    conditions.push(`es.loja_id = $${paramIndex++}`);
    values.push(loja_id);
  }

  if (embalagem_id) {
    conditions.push(`es.embalagem_id = $${paramIndex++}`);
    values.push(embalagem_id);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM embalagens_saldos es WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<EmbalagemSaldo & { loja_nome: string; embalagem_descricao: string }>(
    `SELECT es.*, l.nome as loja_nome, e.descricao as embalagem_descricao
     FROM embalagens_saldos es
     JOIN lojas l ON l.id = es.loja_id
     JOIN embalagens e ON e.id = es.embalagem_id
     WHERE ${whereClause} 
     ORDER BY l.nome, e.descricao
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function listMovimentos(options: ListMovimentosOptions) {
  const { tenantId, page = 1, limit = 20, loja_id, embalagem_id, tipo } = options;
  const { offset, limit: safeLimit } = paginate(page, limit);

  const conditions: string[] = ['em.tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (loja_id) {
    conditions.push(`em.loja_id = $${paramIndex++}`);
    values.push(loja_id);
  }

  if (embalagem_id) {
    conditions.push(`em.embalagem_id = $${paramIndex++}`);
    values.push(embalagem_id);
  }

  if (tipo) {
    conditions.push(`em.tipo = $${paramIndex++}`);
    values.push(tipo);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM embalagens_movimentos em WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<EmbalagemMovimento & { loja_nome: string; embalagem_descricao: string }>(
    `SELECT em.*, l.nome as loja_nome, e.descricao as embalagem_descricao
     FROM embalagens_movimentos em
     JOIN lojas l ON l.id = em.loja_id
     JOIN embalagens e ON e.id = em.embalagem_id
     WHERE ${whereClause} 
     ORDER BY em.data_movimento DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function ajuste(tenantId: string, input: AjusteMovimentoInput): Promise<EmbalagemMovimento> {
  return transaction(async (client) => {
    // Determine quantity change based on type
    let quantidadeChange = input.quantidade;
    let depositoChange = input.valor_deposito_total;

    if (input.tipo === 'saida') {
      quantidadeChange = input.quantidade;
      depositoChange = input.valor_deposito_total;
    } else if (input.tipo === 'entrada') {
      quantidadeChange = -input.quantidade;
      depositoChange = -input.valor_deposito_total;
    }
    // For 'ajuste', use values as-is (can be positive or negative)

    // Update or insert balance
    await client.query(
      `INSERT INTO embalagens_saldos (tenant_id, loja_id, embalagem_id, saldo_quantidade, saldo_deposito)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tenant_id, loja_id, embalagem_id)
       DO UPDATE SET 
         saldo_quantidade = embalagens_saldos.saldo_quantidade + EXCLUDED.saldo_quantidade,
         saldo_deposito = embalagens_saldos.saldo_deposito + EXCLUDED.saldo_deposito`,
      [tenantId, input.loja_id, input.embalagem_id, quantidadeChange, depositoChange]
    );

    // Create movement record
    const result = await client.query<EmbalagemMovimento>(
      `INSERT INTO embalagens_movimentos (tenant_id, loja_id, embalagem_id, tipo, quantidade, valor_deposito_total, referencia_tipo, referencia_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'ajuste_manual', NULL)
       RETURNING *`,
      [tenantId, input.loja_id, input.embalagem_id, input.tipo, Math.abs(input.quantidade), input.valor_deposito_total]
    );

    return result.rows[0];
  });
}
