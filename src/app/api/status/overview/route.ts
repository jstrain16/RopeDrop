import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const lifts = await query('SELECT id, name, slug, is_open FROM lifts ORDER BY name');
    const terrainAreas = await query(
      'SELECT id, name, slug, status FROM terrain_areas ORDER BY name',
    );

    return NextResponse.json({
      lifts: lifts.rows,
      terrain_areas: terrainAreas.rows,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load overview' }, { status: 500 });
  }
}

