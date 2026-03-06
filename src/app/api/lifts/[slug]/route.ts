import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const lift = await query<{
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
     WHERE slug = $1`,
    [slug]
  );

  if (lift.length === 0) {
    return NextResponse.json({ error: 'Lift not found' }, { status: 404 });
  }

  const trails = await query<{
    id: number;
    name: string;
    slug: string;
    difficulty: string | null;
    status: string;
    is_open: boolean;
    is_groomed: boolean;
    lift_id: number;
    last_updated_at: Date;
  }>(
    `SELECT id, name, slug, difficulty, status, is_open, is_groomed, lift_id, last_updated_at
     FROM trails
     WHERE lift_id = $1
     ORDER BY name`,
    [lift[0].id]
  );

  return NextResponse.json({ lift: lift[0], trails });
}
