import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import config from '../config';

// Database connection pool
const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Database query helper
export async function query<T extends QueryResultRow = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  
  if (config.server.nodeEnv === 'development') {
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: result.rowCount });
  }
  
  return result;
}

// Transaction helper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get a client with RLS context set
export async function getClientWithTenant(tenantId: string) {
  const client = await pool.connect();
  await client.query('SET app.current_tenant_id = $1', [tenantId]);
  return client;
}

export { pool };
export default { query, transaction, pool, getClientWithTenant };
