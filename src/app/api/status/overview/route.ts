import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const [liftsRes, terrainRes] = await Promise.all([
    supabase.from('lifts').select('id, name, slug, capacity, opening_at, closing_at, is_open, updated_at').order('name'),
    supabase.from('terrain_areas').select('id, name, slug, status, notes, updated_at').order('name'),
  ]);

  if (liftsRes.error) {
    return NextResponse.json({ error: liftsRes.error.message }, { status: 500 });
  }
  if (terrainRes.error) {
    return NextResponse.json({ error: terrainRes.error.message }, { status: 500 });
  }

  return NextResponse.json({
    lifts: liftsRes.data,
    terrain_areas: terrainRes.data,
  });
}
