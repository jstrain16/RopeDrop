import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const trail = await query<{
    id: number;
    name: string;
    slug: string;
    difficulty: string | null;
    status: string;
    is_open: boolean;
    is_groomed: boolean;
    lift_id: number | null;
    last_updated_at: Date;
  }>(
    `SELECT id, name, slug, difficulty, status, is_open, is_groomed, lift_id, last_updated_at
     FROM trails
     WHERE slug = $1`,
    [slug]
  );

  if (trail.length === 0) {
    return NextResponse.json({ error: 'Trail not found' }, { status: 404 });
  }

  const lift = trail[0].lift_id
    ? await query<{ id: number; name: string; slug: string }>(
        `SELECT id, name, slug FROM lifts WHERE id = $1`,
        [trail[0].lift_id]
      )
    : null;

  const history = await query<{
    id: number;
    old_status: string | null;
    new_status: string;
    changed_at: Date;
  }>(
    `SELECT id, old_status, new_status, changed_at
     FROM trail_status_history
     WHERE trail_id = $1
     ORDER BY changed_at DESC
     LIMIT 20`,
    [trail[0].id]
  );

  return NextResponse.json({
    trail: trail[0],
    lift: lift?.[0] ?? null,
    history,
  });
}
