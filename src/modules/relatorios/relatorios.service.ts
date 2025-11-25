import { query } from '../../database/connection';

interface DateRangeOptions {
  tenantId: string;
  data_inicio?: string;
  data_fim?: string;
  loja_id?: string;
  fornecedor_id?: string;
}

export async function relatorioCompras(options: DateRangeOptions) {
  const { tenantId, data_inicio, data_fim, fornecedor_id } = options;

  const conditions: string[] = ['c.tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (data_inicio) {
    conditions.push(`c.data_compra >= $${paramIndex++}`);
    values.push(data_inicio);
  }

  if (data_fim) {
    conditions.push(`c.data_compra <= $${paramIndex++}`);
    values.push(data_fim);
  }

  if (fornecedor_id) {
    conditions.push(`c.fornecedor_id = $${paramIndex++}`);
    values.push(fornecedor_id);
  }

  const whereClause = conditions.join(' AND ');

  const result = await query(
    `SELECT 
       c.id,
       c.data_compra,
       f.nome as fornecedor_nome,
       c.valor_total,
       c.descontos,
       c.acrescimos,
       c.status,
       c.metodo_pagamento,
       COUNT(ci.id) as total_itens
     FROM compras c
     JOIN fornecedores f ON f.id = c.fornecedor_id
     LEFT JOIN compras_itens ci ON ci.compra_id = c.id
     WHERE ${whereClause}
     GROUP BY c.id, f.nome
     ORDER BY c.data_compra DESC`,
    values
  );

  // Summary
  const summaryResult = await query(
    `SELECT 
       COUNT(*) as total_compras,
       COALESCE(SUM(valor_total), 0) as valor_total,
       COALESCE(SUM(descontos), 0) as total_descontos,
       COALESCE(SUM(acrescimos), 0) as total_acrescimos
     FROM compras c
     WHERE ${whereClause}`,
    values
  );

  return {
    compras: result.rows,
    resumo: summaryResult.rows[0],
  };
}

export async function relatorioRomaneios(options: DateRangeOptions) {
  const { tenantId, data_inicio, data_fim, loja_id } = options;

  const conditions: string[] = ['r.tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (data_inicio) {
    conditions.push(`r.data_romaneio >= $${paramIndex++}`);
    values.push(data_inicio);
  }

  if (data_fim) {
    conditions.push(`r.data_romaneio <= $${paramIndex++}`);
    values.push(data_fim);
  }

  const whereClause = conditions.join(' AND ');

  let lojaFilter = '';
  if (loja_id) {
    lojaFilter = ` AND ri.loja_id = $${paramIndex++}`;
    values.push(loja_id);
  }

  const result = await query(
    `SELECT 
       r.id,
       r.data_romaneio,
       r.status,
       COUNT(DISTINCT ri.loja_id) as total_lojas,
       COALESCE(SUM(ri.valor_total), 0) as valor_total,
       COALESCE(SUM(ri.valor_deposito_total), 0) as valor_depositos
     FROM romaneios r
     LEFT JOIN romaneios_itens ri ON ri.romaneio_id = r.id ${lojaFilter}
     WHERE ${whereClause}
     GROUP BY r.id
     ORDER BY r.data_romaneio DESC`,
    values
  );

  return {
    romaneios: result.rows,
  };
}

export async function relatorioFinanceiro(options: DateRangeOptions) {
  const { tenantId, data_inicio, data_fim, loja_id, fornecedor_id } = options;

  // Titulos loja -> comprador
  const conditionsLoja: string[] = ['tlc.tenant_id = $1'];
  const valuesLoja: unknown[] = [tenantId];
  let paramIndexLoja = 2;

  if (data_inicio) {
    conditionsLoja.push(`tlc.data_vencimento >= $${paramIndexLoja++}`);
    valuesLoja.push(data_inicio);
  }

  if (data_fim) {
    conditionsLoja.push(`tlc.data_vencimento <= $${paramIndexLoja++}`);
    valuesLoja.push(data_fim);
  }

  if (loja_id) {
    conditionsLoja.push(`tlc.loja_id = $${paramIndexLoja++}`);
    valuesLoja.push(loja_id);
  }

  const whereClauseLoja = conditionsLoja.join(' AND ');

  const titulosLojaResult = await query(
    `SELECT 
       status,
       COUNT(*) as quantidade,
       COALESCE(SUM(valor_total), 0) as valor_total
     FROM titulos_loja_comprador tlc
     WHERE ${whereClauseLoja}
     GROUP BY status`,
    valuesLoja
  );

  // Titulos comprador -> fornecedor
  const conditionsForn: string[] = ['tcf.tenant_id = $1'];
  const valuesForn: unknown[] = [tenantId];
  let paramIndexForn = 2;

  if (data_inicio) {
    conditionsForn.push(`tcf.data_vencimento >= $${paramIndexForn++}`);
    valuesForn.push(data_inicio);
  }

  if (data_fim) {
    conditionsForn.push(`tcf.data_vencimento <= $${paramIndexForn++}`);
    valuesForn.push(data_fim);
  }

  if (fornecedor_id) {
    conditionsForn.push(`tcf.fornecedor_id = $${paramIndexForn++}`);
    valuesForn.push(fornecedor_id);
  }

  const whereClauseForn = conditionsForn.join(' AND ');

  const titulosFornResult = await query(
    `SELECT 
       status,
       COUNT(*) as quantidade,
       COALESCE(SUM(valor_principal), 0) as valor_total
     FROM titulos_comprador_fornecedor tcf
     WHERE ${whereClauseForn}
     GROUP BY status`,
    valuesForn
  );

  return {
    titulos_loja_comprador: titulosLojaResult.rows,
    titulos_comprador_fornecedor: titulosFornResult.rows,
  };
}

export async function relatorioEmbalagens(options: DateRangeOptions) {
  const { tenantId, loja_id } = options;

  const conditions: string[] = ['es.tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (loja_id) {
    conditions.push(`es.loja_id = $${paramIndex++}`);
    values.push(loja_id);
  }

  const whereClause = conditions.join(' AND ');

  const saldosResult = await query(
    `SELECT 
       l.nome as loja_nome,
       e.descricao as embalagem_descricao,
       es.saldo_quantidade,
       es.saldo_deposito
     FROM embalagens_saldos es
     JOIN lojas l ON l.id = es.loja_id
     JOIN embalagens e ON e.id = es.embalagem_id
     WHERE ${whereClause}
     ORDER BY l.nome, e.descricao`,
    values
  );

  // Summary by embalagem
  const summaryResult = await query(
    `SELECT 
       e.descricao as embalagem,
       SUM(es.saldo_quantidade) as total_quantidade,
       SUM(es.saldo_deposito) as total_deposito
     FROM embalagens_saldos es
     JOIN embalagens e ON e.id = es.embalagem_id
     WHERE es.tenant_id = $1
     GROUP BY e.id, e.descricao`,
    [tenantId]
  );

  return {
    saldos: saldosResult.rows,
    resumo_por_embalagem: summaryResult.rows,
  };
}

export async function relatorioDevolucoes(options: DateRangeOptions) {
  const { tenantId, data_inicio, data_fim, loja_id } = options;

  const conditions: string[] = ['d.tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (data_inicio) {
    conditions.push(`d.data_devolucao >= $${paramIndex++}`);
    values.push(data_inicio);
  }

  if (data_fim) {
    conditions.push(`d.data_devolucao <= $${paramIndex++}`);
    values.push(data_fim);
  }

  if (loja_id) {
    conditions.push(`d.loja_id = $${paramIndex++}`);
    values.push(loja_id);
  }

  const whereClause = conditions.join(' AND ');

  const result = await query(
    `SELECT 
       d.id,
       d.data_devolucao,
       l.nome as loja_nome,
       d.motivo,
       d.tratamento,
       d.status,
       COUNT(di.id) as total_itens,
       COALESCE(SUM(di.valor_total), 0) as valor_total
     FROM devolucoes d
     JOIN lojas l ON l.id = d.loja_id
     LEFT JOIN devolucoes_itens di ON di.devolucao_id = d.id
     WHERE ${whereClause}
     GROUP BY d.id, l.nome
     ORDER BY d.data_devolucao DESC`,
    values
  );

  // Summary by tratamento
  const summaryResult = await query(
    `SELECT 
       d.tratamento,
       COUNT(*) as quantidade,
       COALESCE(SUM(di.valor_total), 0) as valor_total
     FROM devolucoes d
     LEFT JOIN devolucoes_itens di ON di.devolucao_id = d.id
     WHERE ${whereClause}
     GROUP BY d.tratamento`,
    values
  );

  return {
    devolucoes: result.rows,
    resumo_por_tratamento: summaryResult.rows,
  };
}
