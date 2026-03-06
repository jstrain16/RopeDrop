import { query } from '@/lib/db';

const DEMO_USER_ID = process.env.DEMO_USER_ID;

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  if (!DEMO_USER_ID) {
    return <p>Configuration error: DEMO_USER_ID not set.</p>;
  }

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
    [DEMO_USER_ID]
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
    [DEMO_USER_ID]
  );

  return (
    <main style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Preferences</h1>
      <h2>Terrain Area Notifications</h2>
      {terrainPrefs.length === 0 ? <p>No preferences set.</p> : (
        <ul>
          {terrainPrefs.map(p => (
            <li key={p.terrain_area_id}>
              {p.name} – {p.notify_enabled ? 'On' : 'Off'}
            </li>
          ))}
        </ul>
      )}

      <h2>Trail Notifications</h2>
      {trailPrefs.length === 0 ? <p>No preferences set.</p> : (
        <ul>
          {trailPrefs.map(p => (
            <li key={p.trail_id}>
              {p.name} ({p.difficulty || 'n/a'}) – {p.notify_enabled ? 'On' : 'Off'}
            </li>
          ))}
        </ul>
      )}

      <p>Toggles will be implemented soon.</p>
    </main>
  );
}
