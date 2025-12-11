import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const liftRes = await query(
      'SELECT id, name, slug, capacity, opening_at, closing_at, is_open, last_updated_at FROM lifts WHERE slug = $1',
      [params.slug],
    );
    const lift = liftRes.rows[0];
    if (!lift) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const trailsRes = await query(
      'SELECT id, lift_id, name, slug, difficulty, status, is_open, is_groomed, last_updated_at FROM trails WHERE lift_id = $1 ORDER BY name',
      [lift.id],
    );

    return NextResponse.json({ lift: { ...lift, trails: trailsRes.rows } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load lift' }, { status: 500 });
  }
}

