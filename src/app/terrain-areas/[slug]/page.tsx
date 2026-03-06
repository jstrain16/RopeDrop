import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import Link from 'next/link';
import styles from './[slug].module.css';

type TerrainArea = {
  id: number;
  name: string;
  slug: string;
  status: string;
  notes: string | null;
  last_updated_at: Date;
};

type History = {
  id: number;
  old_status: string | null;
  new_status: string;
  changed_at: Date;
};

export const dynamic = 'force-dynamic';

export default async function TerrainAreaPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const area = await query<TerrainArea>(
    'SELECT id, name, slug, status, notes FROM terrain_areas WHERE slug = $1',
    [slug]
  );

  if (!area || area.length === 0) {
    notFound();
  }

  const history = await query<History>(
    `SELECT id, old_status, new_status, changed_at
     FROM terrain_area_status_history
     WHERE terrain_area_id = $1
     ORDER BY changed_at DESC
     LIMIT 20`,
    [area[0].id]
  );

  const areaInfo = area[0];

  return (
    <main className={styles.container}>
      <Link href="/" className={styles.back}>← Back</Link>
      <h1>{areaInfo.name}</h1>
      <p>Status: <strong>{areaInfo.status}</strong></p>
      {areaInfo.notes && <p>Notes: {areaInfo.notes}</p>}

      <h2>Recent Changes</h2>
      {history.length === 0 ? <p>No history.</p> : (
        <ul className={styles.historyList}>
          {history.map(h => (
            <li key={h.id} className={styles.historyItem}>
              {new Date(h.changed_at).toLocaleString()}: {h.old_status || 'none'} → {h.new_status}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
