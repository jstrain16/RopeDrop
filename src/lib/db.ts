import { Pool, PoolClient, QueryResult } from 'pg';

type QueryArgs = ReadonlyArray<unknown> | undefined;

declare global {
  var __dbPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }
  return new Pool({
    connectionString,
    max: 10,
  });
}

function getPool() {
  if (!global.__dbPool) {
    global.__dbPool = createPool();
  }
  return global.__dbPool;
}

export async function query<T = unknown>(
  text: string,
  params?: QueryArgs,
): Promise<QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}

export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return pool.connect();
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

