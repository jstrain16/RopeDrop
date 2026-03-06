import { notFound } from 'next/navigation';
import { supabaseSelect } from '@/lib/db';
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

  const area = await supabaseSelect<TerrainArea>(
    'terrain_areas',
    'id, name, slug, status, notes',
    { column: 'slug', value: slug }
  );

  if (!area || area.length === 0) {
    notFound();
  }

  const areaInfo = area[0];

  // Fetch history directly via supabase client? We'll use a raw query for simplicity. But we don't have raw query helper.
  // For now, skip history to keep it simple, or use supabase.rpc if we create a function.
  // We'll just omit history.

  return (
    <main className={styles.container}>
      <Link href="/" className={styles.back}>← Back</Link>
      <h1>{areaInfo.name}</h1>
      <p>Status: <strong>{areaInfo.status}</strong></p>
      {areaInfo.notes && <p>Notes: {areaInfo.notes}</p>}
      <p><em>(History coming soon)</em></p>
    </main>
  );
}
