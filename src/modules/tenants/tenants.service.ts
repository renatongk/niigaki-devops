import { query } from '../../database/connection';
import { NotFoundError } from '../../middleware';
import { Tenant } from '../../types';
import { UpdateTenantInput } from './tenants.schema';

export async function getTenant(tenantId: string): Promise<Tenant> {
  const result = await query<Tenant>(
    `SELECT * FROM tenants WHERE id = $1`,
    [tenantId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Tenant não encontrado');
  }

  return result.rows[0];
}

export async function updateTenant(tenantId: string, input: UpdateTenantInput): Promise<Tenant> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.nome !== undefined) {
    updates.push(`nome = $${paramIndex++}`);
    values.push(input.nome);
  }

  if (input.documento !== undefined) {
    updates.push(`documento = $${paramIndex++}`);
    values.push(input.documento);
  }

  if (input.configuracoes_json !== undefined) {
    updates.push(`configuracoes_json = $${paramIndex++}`);
    values.push(JSON.stringify(input.configuracoes_json));
  }

  if (updates.length === 0) {
    return getTenant(tenantId);
  }

  values.push(tenantId);

  const result = await query<Tenant>(
    `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Tenant não encontrado');
  }

  return result.rows[0];
}
