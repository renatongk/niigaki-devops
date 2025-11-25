import { query } from '../../database/connection';
import { AuditLog } from '../../types';
import { paginate, formatPaginationResponse } from '../../utils';

interface ListLogsOptions {
  tenantId: string;
  page?: number;
  limit?: number;
  user_id?: string;
  action?: string;
  entity_type?: string;
  data_inicio?: string;
  data_fim?: string;
}

export async function list(options: ListLogsOptions) {
  const { tenantId, page = 1, limit = 20, user_id, action, entity_type, data_inicio, data_fim } = options;
  const { offset, limit: safeLimit } = paginate(page, limit);

  const conditions: string[] = ['al.tenant_id = $1'];
  const values: unknown[] = [tenantId];
  let paramIndex = 2;

  if (user_id) {
    conditions.push(`al.user_id = $${paramIndex++}`);
    values.push(user_id);
  }

  if (action) {
    conditions.push(`al.action = $${paramIndex++}`);
    values.push(action);
  }

  if (entity_type) {
    conditions.push(`al.entity_type = $${paramIndex++}`);
    values.push(entity_type);
  }

  if (data_inicio) {
    conditions.push(`al.created_at >= $${paramIndex++}`);
    values.push(data_inicio);
  }

  if (data_fim) {
    conditions.push(`al.created_at <= $${paramIndex++}`);
    values.push(data_fim);
  }

  const whereClause = conditions.join(' AND ');

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM audit_logs al WHERE ${whereClause}`,
    values
  );

  const total = parseInt(countResult.rows[0].count, 10);

  values.push(safeLimit, offset);
  const result = await query<AuditLog & { user_nome: string }>(
    `SELECT al.*, u.nome as user_nome
     FROM audit_logs al
     LEFT JOIN usuarios u ON u.id = al.user_id
     WHERE ${whereClause}
     ORDER BY al.created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
    values
  );

  return {
    data: result.rows,
    pagination: formatPaginationResponse(page, safeLimit, total),
  };
}

export async function createLog(
  tenantId: string,
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  oldValues?: Record<string, unknown>,
  newValues?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<AuditLog> {
  const result = await query<AuditLog>(
    `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      tenantId,
      userId,
      action,
      entityType,
      entityId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress,
      userAgent,
    ]
  );

  return result.rows[0];
}
