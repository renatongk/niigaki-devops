import { query, transaction } from '../../database/connection';
import { NotFoundError, ValidationError } from '../../middleware';
import { Devolucao, DevolucaoItem } from '../../types';
import { paginate, formatPaginationResponse } from '../../utils';
import { CreateDevolucaoInput } from './devolucoes.schema';

interface ListOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  loja_id?: string;
  status?: string;
  lojasPermitidas?: string[];
}

interface DevolucaoWithItems extends Devolucao {
  itens: DevolucaoItem[];
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
    `SELECT COUNT(*) as count FROM devolucoes WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<Devolucao>(
    `SELECT * FROM devolucoes WHERE ${whereClause} ORDER BY data_devolucao DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function getById(tenantId: string, id: string): Promise<DevolucaoWithItems> {
  const result = await query<Devolucao>(
    `SELECT * FROM devolucoes WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Devolução não encontrada');
  }

  const devolucao = result.rows[0];

  const itensResult = await query<DevolucaoItem>(
    `SELECT di.*, p.nome as produto_nome 
     FROM devolucoes_itens di
     JOIN produtos p ON p.id = di.produto_id
     WHERE devolucao_id = $1`,
    [id]
  );

  return {
    ...devolucao,
    itens: itensResult.rows,
  };
}

export async function create(tenantId: string, input: CreateDevolucaoInput): Promise<DevolucaoWithItems> {
  return transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO devolucoes (tenant_id, loja_id, romaneio_id, motivo, tratamento, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [tenantId, input.loja_id, input.romaneio_id, input.motivo, input.tratamento, input.observacoes]
    );

    const devolucao = result.rows[0] as Devolucao;

    // Insert items
    const itens: DevolucaoItem[] = [];
    for (const item of input.itens) {
      const valorTotal = item.quantidade * item.valor_unitario;
      
      const itemResult = await client.query(
        `INSERT INTO devolucoes_itens (devolucao_id, produto_id, quantidade, motivo_especifico, valor_unitario, valor_total)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [devolucao.id, item.produto_id, item.quantidade, item.motivo_especifico, item.valor_unitario, valorTotal]
      );
      itens.push(itemResult.rows[0] as DevolucaoItem);
    }

    return { ...devolucao, itens };
  });
}

export async function processar(tenantId: string, id: string): Promise<DevolucaoWithItems> {
  const devolucao = await getById(tenantId, id);
  
  if (devolucao.status !== 'pendente') {
    throw new ValidationError('Apenas devoluções pendentes podem ser processadas');
  }

  return transaction(async (client) => {
    // Update status
    await client.query(
      `UPDATE devolucoes SET status = 'processada' WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    // Calculate total value
    const valorTotal = devolucao.itens.reduce((sum, item) => sum + item.valor_total, 0);

    // Handle based on treatment type
    switch (devolucao.tratamento) {
      case 'credito':
        // Create credit title
        await client.query(
          `INSERT INTO titulos_loja_comprador (tenant_id, tipo, loja_id, romaneio_id, valor_principal, valor_depositos, valor_total, data_vencimento)
           VALUES ($1, 'pagar', $2, $3, $4, 0, $4, NOW() + INTERVAL '30 days')`,
          [tenantId, devolucao.loja_id, devolucao.romaneio_id, valorTotal]
        );
        break;

      case 'estorno':
        // Update existing title if linked to romaneio
        if (devolucao.romaneio_id) {
          await client.query(
            `UPDATE titulos_loja_comprador 
             SET valor_total = valor_total - $1,
                 valor_principal = valor_principal - $1
             WHERE romaneio_id = $2 AND tenant_id = $3 AND status = 'aberto'`,
            [valorTotal, devolucao.romaneio_id, tenantId]
          );
        }
        break;

      case 'troca':
        // For exchange, no financial movement - handled operationally
        break;
    }

    return getById(tenantId, id);
  });
}

export async function cancelar(tenantId: string, id: string): Promise<DevolucaoWithItems> {
  const devolucao = await getById(tenantId, id);
  
  if (devolucao.status !== 'pendente') {
    throw new ValidationError('Apenas devoluções pendentes podem ser canceladas');
  }

  await query(
    `UPDATE devolucoes SET status = 'cancelada' WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  return getById(tenantId, id);
}
