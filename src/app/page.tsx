import { query } from '@/lib/db';
import LiftCard from '@/components/LiftCard';
import TerrainAreaCard from '@/components/TerrainAreaCard';

type Lift = {
  id: number;
  name: string;
  slug: string;
  is_open: boolean;
};

type TerrainArea = {
  id: number;
  name: string;
  slug: string;
  status: string;
  notes: string | null;
};

export default async function Home() {
  const [lifts, terrainAreas] = await Promise.all([
    query<Lift>('SELECT id, name, slug, is_open FROM lifts ORDER BY name'),
    query<TerrainArea>('SELECT id, name, slug, status, notes FROM terrain_areas ORDER BY name'),
  ]);

  return (
    <main style={{ padding: '1rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Alta Eyes</h1>
      <section>
        <h2>Lifts</h2>
        {lifts.length === 0 ? <p>No lift data.</p> : lifts.map(lift => <LiftCard key={lift.id} lift={lift} />)}
      </section>
      <section style={{ marginTop: '2rem' }}>
        <h2>Terrain Areas</h2>
        {terrainAreas.length === 0 ? <p>No terrain area data.</p> : terrainAreas.map(area => <TerrainAreaCard key={area.id} area={area} />)}
      </section>
    </main>
  );
}
