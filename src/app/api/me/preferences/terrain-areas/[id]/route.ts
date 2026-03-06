import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

const DEMO_USER_ID = process.env.DEMO_USER_ID;
if (!DEMO_USER_ID) {
  throw new Error('DEMO_USER_ID is required');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const terrainAreaId = parseInt(id, 10);
  if (isNaN(terrainAreaId)) {
    return NextResponse.json({ error: 'Invalid terrain area ID' }, { status: 400 });
  }

  const userId = DEMO_USER_ID;
  await query('INSERT INTO app_users (id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);

  const body = await request.json();
  const { notify_enabled } = body;
  if (typeof notify_enabled !== 'boolean') {
    return NextResponse.json({ error: 'Missing notify_enabled' }, { status: 400 });
  }

  await query(
    `INSERT INTO user_terrain_area_prefs (user_id, terrain_area_id, notify_enabled)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, terrain_area_id)
     DO UPDATE SET notify_enabled = $3`,
    [userId, terrainAreaId, notify_enabled]
  );

  return NextResponse.json({ ok: true });
}
