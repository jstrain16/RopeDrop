import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DEMO_USER_ID = process.env.DEMO_USER_ID;
if (!DEMO_USER_ID) {
  throw new Error('DEMO_USER_ID is required');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const terrainAreaId = parseInt(id, 10);
  if (isNaN(terrainAreaId)) {
    return NextResponse.json({ error: 'Invalid terrain area ID' }, { status: 400 });
  }

  const userId = DEMO_USER_ID;
  const body = await request.json();
  const { notify_enabled } = body;
  if (typeof notify_enabled !== 'boolean') {
    return NextResponse.json({ error: 'Missing notify_enabled' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_terrain_area_prefs')
    .upsert({ user_id: userId, terrain_area_id: terrainAreaId, notify_enabled }, { onConflict: 'user_id,terrain_area_id' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
