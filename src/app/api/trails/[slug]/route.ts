import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const trailRes = await query(
      `
        SELECT t.id, t.lift_id, t.name, t.slug, t.difficulty, t.status, t.is_open, t.is_groomed, t.last_updated_at,
               l.name as lift_name, l.slug as lift_slug
        FROM trails t
        LEFT JOIN lifts l ON l.id = t.lift_id
        WHERE t.slug = $1
      `,
      [params.slug],
    );
    const trail = trailRes.rows[0];
    if (!trail) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const historyRes = await query(
      `
        SELECT id, old_status, new_status, changed_at
        FROM trail_status_history
        WHERE trail_id = $1
        ORDER BY changed_at DESC
        LIMIT 5
      `,
      [trail.id],
    );

    return NextResponse.json({
      trail: {
        id: trail.id,
        name: trail.name,
        slug: trail.slug,
        difficulty: trail.difficulty,
        status: trail.status,
        is_open: trail.is_open,
        is_groomed: trail.is_groomed,
        last_updated_at: trail.last_updated_at,
        lift: trail.lift_id
          ? { id: trail.lift_id, name: trail.lift_name, slug: trail.lift_slug }
          : null,
      },
      history: historyRes.rows,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load trail' }, { status: 500 });
  }
}

