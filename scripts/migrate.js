import { Pool } from 'pg';
import { readFile } from 'fs/promises';

async function run() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL required');
  }
  const pool = new Pool({ connectionString });
  const sql = await readFile('db/migrations/0001_init.sql', 'utf8');
  try {
    await pool.query(sql);
    console.log('Migration applied successfully');
  } catch (e) {
    console.error('Migration failed', e);
    throw e;
  } finally {
    await pool.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
