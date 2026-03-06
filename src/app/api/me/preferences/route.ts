import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const DEMO_USER_ID = process.env.DEMO_USER_ID;
if (!DEMO_USER_ID) {
  throw new Error('DEMO_USER_ID is required');
}

export async function GET() {
  const userId = DEMO_USER_ID;

  // Ensure user exists - we can skip because foreign keys may not require it.

  // Fetch terrain area preferences with join
  const { data: terrainPrefs, error: terrainError } = await supabase
    .from('user_terrain_area_prefs')
    .select('notify_enabled, terrain_area_id, terrain_areas:terrain_area_id (name, slug)')
    .eq('user_id', userId)
    .order('terrain_areas(name)');

  if (terrainError) {
    return NextResponse.json({ error: terrainError.message }, { status: 500 });
  }

  // Fetch trail preferences with join
  const { data: trailPrefs, error: trailError } = await supabase
    .from('user_trail_prefs')
    .select('notify_enabled, trail_id, trails:trail_id (name, slug, difficulty)')
    .eq('user_id', userId)
    .order('trails(name)');

  if (trailError) {
    return NextResponse.json({ error: trailError.message }, { status: 500 });
  }

  return NextResponse.json({
    terrain_areas: terrainPrefs,
    trails: trailPrefs,
  });
}

export async function POST(request: NextRequest) {
  const userId = DEMO_USER_ID;
  const body = await request.json();
  const { notify_enabled, type, id } = body; // type: 'terrain'|'trail', id: area_id or trail_id
  if (typeof notify_enabled !== 'boolean' || !type || !id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (type === 'terrain') {
    const { error } = await supabase
      .from('user_terrain_area_prefs')
      .upsert({ user_id: userId, terrain_area_id: id, notify_enabled }, { onConflict: 'user_id,terrain_area_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (type === 'trail') {
    const { error } = await supabase
      .from('user_trail_prefs')
      .upsert({ user_id: userId, trail_id: id, notify_enabled }, { onConflict: 'user_id,trail_id' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
