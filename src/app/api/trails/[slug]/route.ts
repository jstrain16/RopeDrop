import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: trail, error: trailError } = await supabase
    .from('trails')
    .select('id, name, slug, difficulty, status, is_open, is_groomed, lift_id')
    .eq('slug', slug)
    .single();

  if (trailError || !trail) {
    return NextResponse.json({ error: 'Trail not found' }, { status: 404 });
  }

  let lift: any = null;
  if (trail.lift_id) {
    const { data: liftData } = await supabase
      .from('lifts')
      .select('id, name, slug')
      .eq('id', trail.lift_id)
      .single();
    lift = liftData;
  }

  // History would require RPC; skip for now.
  const history: any[] = [];

  return NextResponse.json({ trail, lift, history });
}
