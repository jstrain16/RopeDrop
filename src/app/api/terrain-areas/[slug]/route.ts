import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const area = await query<{
    id: number;
    name: string;
    slug: string;
    status: string;
    notes: string | null;
    last_updated_at: Date;
  }>(
    `SELECT id, name, slug, status, notes, last_updated_at
     FROM terrain_areas
     WHERE slug = $1`,
    [slug]
  );

  if (area.length === 0) {
    return NextResponse.json({ error: 'Terrain area not found' }, { status: 404 });
  }

  const history = await query<{
    id: number;
    old_status: string | null;
    new_status: string;
    changed_at: Date;
  }>(
    `SELECT id, old_status, new_status, changed_at
     FROM terrain_area_status_history
     WHERE terrain_area_id = $1
     ORDER BY changed_at DESC
     LIMIT 20`,
    [area[0].id]
  );

  return NextResponse.json({ terrain_area: area[0], history });
}
