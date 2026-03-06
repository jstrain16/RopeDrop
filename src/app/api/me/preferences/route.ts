import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const DEMO_USER_ID = process.env.DEMO_USER_ID;
if (!DEMO_USER_ID) {
  throw new Error('DEMO_USER_ID is required');
}

export async function GET() {
  const userId = DEMO_USER_ID;

  // Ensure user exists
  await query('INSERT INTO app_users (id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);

  const terrainPrefs = await query<{
    terrain_area_id: number;
    notify_enabled: boolean;
    name: string;
    slug: string;
  }>(
    `SELECT u.terrain_area_id, u.notify_enabled, a.name, a.slug
     FROM user_terrain_area_prefs u
     JOIN terrain_areas a ON a.id = u.terrain_area_id
     WHERE u.user_id = $1
     ORDER BY a.name`,
    [userId]
  );

  const trailPrefs = await query<{
    trail_id: number;
    notify_enabled: boolean;
    name: string;
    slug: string;
    difficulty: string | null;
  }>(
    `SELECT u.trail_id, u.notify_enabled, t.name, t.slug, t.difficulty
     FROM user_trail_prefs u
     JOIN trails t ON t.id = u.trail_id
     WHERE u.user_id = $1
     ORDER BY t.name`,
    [userId]
  );

  return NextResponse.json({ terrain_areas: terrainPrefs, trails: trailPrefs });
}

export async function POST(request: NextRequest) {
  const userId = DEMO_USER_ID;
  await query('INSERT INTO app_users (id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);

  const body = await request.json();
  const { notify_enabled } = body;
  if (typeof notify_enabled !== 'boolean') {
    return NextResponse.json({ error: 'Missing notify_enabled' }, { status: 400 });
  }

  // For simplicity, ignore setting general prefs via POST to this endpoint.
  return NextResponse.json({ ok: true });
}
