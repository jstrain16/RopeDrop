import { notFound } from 'next/navigation';
import { supabaseSelect } from '@/lib/db';
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

export const dynamic = 'force-dynamic';

export default async function TrailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const trail = await supabaseSelect<Trail>(
    'trails',
    'id, name, slug, difficulty, status, is_open, is_groomed, lift_id',
    { column: 'slug', value: slug }
  );

  if (!trail || trail.length === 0) {
    notFound();
  }

  const trailInfo = trail[0];

  let lift: Lift | null = null;
  if (trailInfo.lift_id) {
    const liftData = await supabaseSelect<Lift>('lifts', 'id, name, slug', { column: 'id', value: trailInfo.lift_id });
    lift = liftData[0] || null;
  }

  return (
    <main className={styles.container}>
      <Link href="/" className={styles.back}>← Back</Link>
      <h1>{trailInfo.name}</h1>
      <p>Status: <strong>{trailInfo.status}</strong> {trailInfo.is_open ? '(Open)' : '(Closed)'}</p>
      {trailInfo.difficulty && <p>Difficulty: {trailInfo.difficulty}</p>}
      {trailInfo.is_groomed && <p>Groomed ✓</p>}
      {lift && (
        <p>Lift: <Link href={`/lifts/${lift.slug}`}>{lift.name}</Link></p>
      )}
    </main>
  );
}
