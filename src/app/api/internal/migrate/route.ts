import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  const expected = process.env.CRON_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sqlPath = path.join(process.cwd(), 'db', 'migrations', '0001_init.sql');
    const sql = await readFile(sqlPath, 'utf8');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Split on semicolons to execute each statement
      const statements = sql.split(';').map(s => s.trim()).filter(s => s);
      for (const stmt of statements) {
        await client.query(stmt);
      }
      await client.query('COMMIT');
      return NextResponse.json({ ok: true, applied: statements.length });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
}
