import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch pending notifications
  const { data: pending, error } = await supabase
    .from('pending_notifications')
    .select('id, user_id, entity_type, entity_id')
    .eq('processed', false)
    .order('event_at')
    .limit(50);

  if (error) {
    // Table may not exist yet; ignore
    return NextResponse.json({ processed: 0 });
  }

  // Mark as processed (stub)
  const ids = (pending || []).map(p => p.id);
  if (ids.length > 0) {
    await supabase.from('pending_notifications').update({ processed: true, processed_at: new Date().toISOString() }).in('id', ids);
  }

  return NextResponse.json({ processed: ids.length });
}
