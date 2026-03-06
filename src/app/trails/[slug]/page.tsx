import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import Link from 'next/link';
import styles from './[slug].module.css';

type Trail = {
  id: number;
  name: string;
  slug: string;
  difficulty: string | null;
  status: string;
  is_open: boolean;
  is_groomed: boolean;
  lift_id: number | null;
};

type Lift = {
  id: number;
  name: string;
  slug: string;
};

type History = {
  id: number;
  old_status: string | null;
  new_status: string;
  changed_at: Date;
};

export async function generateStaticParams() {
  const trails = await query<Trail>('SELECT slug FROM trails');
  return trails.map(trail => ({ slug: trail.slug }));
}

export default async function TrailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const trail = await query<Trail>(
    'SELECT id, name, slug, difficulty, status, is_open, is_groomed, lift_id FROM trails WHERE slug = $1',
    [slug]
  );

  if (!trail || trail.length === 0) {
    notFound();
  }

  const trailInfo = trail[0];

  const lift = trailInfo.lift_id
    ? await query<Lift>('SELECT id, name, slug FROM lifts WHERE id = $1', [trailInfo.lift_id])
    : null;

  const history = await query<History>(
    `SELECT id, old_status, new_status, changed_at
     FROM trail_status_history
     WHERE trail_id = $1
     ORDER BY changed_at DESC
     LIMIT 20`,
    [trailInfo.id]
  );

  return (
    <main className={styles.container}>
      <Link href="/" className={styles.back}>← Back</Link>
      <h1>{trailInfo.name}</h1>
      <p>Status: <strong>{trailInfo.status}</strong> {trailInfo.is_open ? '(Open)' : '(Closed)'}</p>
      {trailInfo.difficulty && <p>Difficulty: {trailInfo.difficulty}</p>}
      {trailInfo.is_groomed && <p>Groomed ✓</p>}
      {lift && lift.length > 0 && (
        <p>Lift: <Link href={`/lifts/${lift[0].slug}`}>{lift[0].name}</Link></p>
      )}

      <h2>History</h2>
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
