import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserId } from '@/lib/user';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const userId = getUserId(req);
    const body = await req.json();
    const notifyEnabled = Boolean(body?.notify_enabled);
    const terrainAreaId = Number(params.id);

    await query('INSERT INTO app_users (id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);
    await query(
      `
        INSERT INTO user_terrain_area_prefs (user_id, terrain_area_id, notify_enabled)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, terrain_area_id) DO UPDATE SET notify_enabled = EXCLUDED.notify_enabled
      `,
      [userId, terrainAreaId, notifyEnabled],
    );

    return NextResponse.json({ terrain_area_id: terrainAreaId, notify_enabled: notifyEnabled });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
  }
}

