import { query } from '../../database/connection';
import { NotFoundError, ValidationError } from '../../middleware';
import { TituloLojaComprador, TituloCompradorFornecedor } from '../../types';
import { paginate, formatPaginationResponse } from '../../utils';

interface ListOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  tipo?: 'loja' | 'fornecedor';
  status?: string;
  loja_id?: string;
  fornecedor_id?: string;
}

type Titulo = TituloLojaComprador | TituloCompradorFornecedor;

export async function list(options: ListOptions) {
  const { tenantId, page = 1, limit = 20, tipo, status, loja_id, fornecedor_id } = options;
  const { offset, limit: safeLimit } = paginate(page, limit);

  const results: { titulos_loja: TituloLojaComprador[]; titulos_fornecedor: TituloCompradorFornecedor[] } = {
    titulos_loja: [],
    titulos_fornecedor: [],
  };

  // Get titles from stores
  if (!tipo || tipo === 'loja') {
    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (loja_id) {
      conditions.push(`loja_id = $${paramIndex++}`);
      values.push(loja_id);
    }

    const whereClause = conditions.join(' AND ');
    values.push(safeLimit, offset);

    const result = await query<TituloLojaComprador>(
      `SELECT tlc.*, l.nome as loja_nome 
       FROM titulos_loja_comprador tlc
       JOIN lojas l ON l.id = tlc.loja_id
       WHERE ${whereClause} 
       ORDER BY data_vencimento LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      values
    );

    results.titulos_loja = result.rows;
  }

  // Get titles from suppliers
  if (!tipo || tipo === 'fornecedor') {
    const conditions: string[] = ['tenant_id = $1'];
    const values: unknown[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (fornecedor_id) {
      conditions.push(`fornecedor_id = $${paramIndex++}`);
      values.push(fornecedor_id);
    }

    const whereClause = conditions.join(' AND ');
    values.push(safeLimit, offset);

    const result = await query<TituloCompradorFornecedor>(
      `SELECT tcf.*, f.nome as fornecedor_nome 
       FROM titulos_comprador_fornecedor tcf
       JOIN fornecedores f ON f.id = tcf.fornecedor_id
       WHERE ${whereClause} 
       ORDER BY data_vencimento LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      values
    );

    results.titulos_fornecedor = result.rows;
  }

  return results;
}

export async function getById(tenantId: string, id: string): Promise<{ tipo: 'loja' | 'fornecedor'; titulo: Titulo }> {
  // Try to find in loja_comprador first
  const lojaResult = await query<TituloLojaComprador>(
    `SELECT tlc.*, l.nome as loja_nome 
     FROM titulos_loja_comprador tlc
     JOIN lojas l ON l.id = tlc.loja_id
     WHERE tlc.id = $1 AND tlc.tenant_id = $2`,
    [id, tenantId]
  );

  if (lojaResult.rows.length > 0) {
    return { tipo: 'loja', titulo: lojaResult.rows[0] };
  }

  // Try to find in comprador_fornecedor
  const fornecedorResult = await query<TituloCompradorFornecedor>(
    `SELECT tcf.*, f.nome as fornecedor_nome 
     FROM titulos_comprador_fornecedor tcf
     JOIN fornecedores f ON f.id = tcf.fornecedor_id
     WHERE tcf.id = $1 AND tcf.tenant_id = $2`,
    [id, tenantId]
  );

  if (fornecedorResult.rows.length > 0) {
    return { tipo: 'fornecedor', titulo: fornecedorResult.rows[0] };
  }

  throw new NotFoundError('Título não encontrado');
}

export async function baixar(tenantId: string, id: string): Promise<{ tipo: 'loja' | 'fornecedor'; titulo: Titulo }> {
  const { tipo, titulo } = await getById(tenantId, id);

  if (titulo.status === 'pago') {
    throw new ValidationError('Título já está pago');
  }

  if (titulo.status === 'cancelado') {
    throw new ValidationError('Título cancelado não pode ser baixado');
  }

  const table = tipo === 'loja' ? 'titulos_loja_comprador' : 'titulos_comprador_fornecedor';

  await query(
    `UPDATE ${table} SET status = 'pago' WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  return getById(tenantId, id);
}

export async function estornar(tenantId: string, id: string): Promise<{ tipo: 'loja' | 'fornecedor'; titulo: Titulo }> {
  const { tipo, titulo } = await getById(tenantId, id);

  if (titulo.status !== 'pago') {
    throw new ValidationError('Apenas títulos pagos podem ser estornados');
  }

  const table = tipo === 'loja' ? 'titulos_loja_comprador' : 'titulos_comprador_fornecedor';

  await query(
    `UPDATE ${table} SET status = 'aberto' WHERE id = $1 AND tenant_id = $2`,
    [id, tenantId]
  );

  return getById(tenantId, id);
}
