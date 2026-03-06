import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import Link from 'next/link';
import styles from './[slug].module.css';

type Lift = {
  id: number;
  name: string;
  slug: string;
  capacity: number | null;
  opening_at: string | null;
  closing_at: string | null;
  is_open: boolean;
};

type Trail = {
  id: number;
  name: string;
  slug: string;
  difficulty: string | null;
  status: string;
  is_open: boolean;
  is_groomed: boolean;
};

export const dynamic = 'force-dynamic';

export default async function LiftDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const lift = await query<Lift>(
    'SELECT id, name, slug, capacity, opening_at, closing_at, is_open FROM lifts WHERE slug = $1',
    [slug]
  );

  if (!lift || lift.length === 0) {
    notFound();
  }

  const trails = await query<Trail>(
    `SELECT t.id, t.name, t.slug, t.difficulty, t.status, t.is_open, t.is_groomed
     FROM trails t
     WHERE t.lift_id = $1
     ORDER BY t.name`,
    [lift[0].id]
  );

  const liftInfo = lift[0];

  return (
    <main className={styles.container}>
      <Link href="/" className={styles.back}>← Back</Link>
      <h1>{liftInfo.name}</h1>
      <p>Status: <strong>{liftInfo.is_open ? 'Open' : 'Closed'}</strong></p>
      {liftInfo.capacity && <p>Capacity: {liftInfo.capacity}</p>}
      {liftInfo.opening_at && <p>Opens: {liftInfo.opening_at}</p>}
      {liftInfo.closing_at && <p>Closes: {liftInfo.closing_at}</p>}

      <h2>Trails Served</h2>
      {trails.length === 0 ? <p>No trails associated.</p> : (
        <ul className={styles.trailList}>
          {trails.map(trail => (
            <li key={trail.id} className={styles.trailItem}>
              <Link href={`/trails/${trail.slug}`}>{trail.name}</Link>
              <span> – {trail.status} {trail.is_groomed ? '(Groomed)' : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
