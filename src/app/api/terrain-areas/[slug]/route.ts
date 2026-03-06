import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: area, error: areaError } = await supabase
    .from('terrain_areas')
    .select('id, name, slug, status, notes, updated_at')
    .eq('slug', slug)
    .single();

  if (areaError || !area) {
    return NextResponse.json({ error: 'Terrain area not found' }, { status: 404 });
  }

  // For history, we could use an RPC or direct query via .rpc('get_terrain_area_history', { area_id: area.id })
  // But we don't have an RPC yet. For now, skip history or return empty.
  // We'll leave history empty to avoid build errors.
  const history: any[] = [];

  return NextResponse.json({ terrain_area: area, history });
}
