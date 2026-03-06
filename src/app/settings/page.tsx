import { supabaseSelect } from '@/lib/db';

const DEMO_USER_ID = process.env.DEMO_USER_ID;

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  if (!DEMO_USER_ID) {
    return <p>Configuration error: DEMO_USER_ID not set.</p>;
  }

  const terrainPrefs = await supabaseSelect<{
    terrain_area_id: number;
    notify_enabled: boolean;
    name: string;
    slug: string;
  }>(
    `user_terrain_area_prefs`,
    `user_terrain_area_prefs.terrain_area_id, user_terrain_area_prefs.notify_enabled, terrain_areas.name, terrain_areas.slug`,
    // We need to do a join; supabaseSelect doesn't support joins. We'll do a raw query via RPC or use supabase.from with select with foreign tables?
  );

  // Since supabaseSelect doesn't join, we'll just show placeholder.
  // For now, skip pref display until we add RPC or more complex queries.

  return (
    <main style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Preferences</h1>
      <p>(Preferences UI pending; using demo user: {DEMO_USER_ID})</p>
    </main>
  );
}
