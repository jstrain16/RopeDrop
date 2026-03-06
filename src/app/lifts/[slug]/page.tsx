import { notFound } from 'next/navigation';
import { supabaseSelect } from '@/lib/db';
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

  const lifts = await supabaseSelect<Lift>(
    'lifts',
    'id, name, slug, capacity, opening_at, closing_at, is_open',
    { column: 'slug', value: slug }
  );

  if (!lifts || lifts.length === 0) {
    notFound();
  }

  const lift = lifts[0];

  const trails = await supabaseSelect<Trail>(
    'trails',
    'id, name, slug, difficulty, status, is_open, is_groomed',
    { column: 'lift_id', value: lift.id }
  );

  return (
    <main className={styles.container}>
      <Link href="/" className={styles.back}>← Back</Link>
      <h1>{lift.name}</h1>
      <p>Status: <strong>{lift.is_open ? 'Open' : 'Closed'}</strong></p>
      {lift.capacity && <p>Capacity: {lift.capacity}</p>}
      {lift.opening_at && <p>Opens: {lift.opening_at}</p>}
      {lift.closing_at && <p>Closes: {lift.closing_at}</p>}

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
