import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const areaRes = await query(
      'SELECT id, name, slug, status, notes, last_updated_at FROM terrain_areas WHERE slug = $1',
      [params.slug],
    );
    const area = areaRes.rows[0];
    if (!area) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // The source data does not expose direct mappings; return placeholders for now.
    return NextResponse.json({
      terrain_area: area,
      lifts: [],
      trails: [],
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load terrain area' }, { status: 500 });
  }
}

