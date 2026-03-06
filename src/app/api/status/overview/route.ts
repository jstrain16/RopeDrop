import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  const lifts = await query<{
    id: number;
    name: string;
    slug: string;
    capacity: number | null;
    opening_at: string | null;
    closing_at: string | null;
    is_open: boolean;
    last_updated_at: Date;
  }>(
    `SELECT id, name, slug, capacity, opening_at, closing_at, is_open, last_updated_at
     FROM lifts
     ORDER BY name`
  );

  const terrainAreas = await query<{
    id: number;
    name: string;
    slug: string;
    status: string;
    notes: string | null;
    last_updated_at: Date;
  }>(
    `SELECT id, name, slug, status, notes, last_updated_at
     FROM terrain_areas
     ORDER BY name`
  );

  return NextResponse.json({ lifts, terrain_areas });
}
