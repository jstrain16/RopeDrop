import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch pending notifications (not processed)
  const pending = await query<{ id: number; user_id: string; entity_type: string; entity_id: number }>(
    `SELECT id, user_id, entity_type, entity_id
     FROM pending_notifications
     WHERE processed = false
     ORDER BY event_at
     LIMIT 50`
  );

  // Stub: mark them as processed without sending anything
  for (const p of pending) {
    await query(
      `UPDATE pending_notifications
       SET processed = true, processed_at = NOW()
       WHERE id = $1`,
      [p.id]
    );
  }

  return NextResponse.json({ processed: pending.length });
}
