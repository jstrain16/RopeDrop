const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'migrations', '0001_init.sql'), 'utf8');

// Split on semicolons, keeping order; ignore empty statements
const statements = sql.split(';').map(s => s.trim()).filter(s => s);

const pool = new Pool({ connectionString });

(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const stmt of statements) {
      await client.query(stmt);
    }
    await client.query('COMMIT');
    console.log(`Migration applied: ${statements.length} statements`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
