import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserId } from '@/lib/user';

export async function GET(req: NextRequest) {
  try {
    const userId = getUserId(req);
    await query('INSERT INTO app_users (id) VALUES ($1) ON CONFLICT DO NOTHING', [userId]);

    const terrainPrefs = await query(
      `
        SELECT p.terrain_area_id as id, ta.name, ta.slug
        FROM user_terrain_area_prefs p
        JOIN terrain_areas ta ON ta.id = p.terrain_area_id
        WHERE p.user_id = $1 AND p.notify_enabled = true
        ORDER BY ta.name
      `,
      [userId],
    );

    const trailPrefs = await query(
      `
        SELECT p.trail_id as id, t.name, t.slug, t.difficulty
        FROM user_trail_prefs p
        JOIN trails t ON t.id = p.trail_id
        WHERE p.user_id = $1 AND p.notify_enabled = true
        ORDER BY t.name
      `,
      [userId],
    );

    return NextResponse.json({
      terrain_areas: terrainPrefs.rows,
      trails: trailPrefs.rows,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load preferences' }, { status: 500 });
  }
}

