const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const pool = new Pool({ connectionString: dbUrl });

async function run() {
  const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      console.log(`Applying migration ${file}...`);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`✓ ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✗ ${file} failed:`, err);
      process.exit(1);
    } finally {
      client.release();
    }
  }

  await pool.end();
}

run().catch(console.error);
