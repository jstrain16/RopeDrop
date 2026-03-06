import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const { data: lift, error: liftError } = await supabase
    .from('lifts')
    .select('id, name, slug, capacity, opening_at, closing_at, is_open, updated_at')
    .eq('slug', slug)
    .single();

  if (liftError || !lift) {
    return NextResponse.json({ error: 'Lift not found' }, { status: 404 });
  }

  const { data: trails, error: trailsError } = await supabase
    .from('trails')
    .select('id, name, slug, difficulty, status, is_open, is_groomed, lift_id')
    .eq('lift_id', lift.id)
    .order('name');

  if (trailsError) {
    return NextResponse.json({ error: trailsError.message }, { status: 500 });
  }

  return NextResponse.json({ lift, trails });
}
