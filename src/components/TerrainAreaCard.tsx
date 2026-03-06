'use client';

import Link from 'next/link';
import styles from './TerrainAreaCard.module.css';

type TerrainArea = {
  id: number;
  name: string;
  slug: string;
  status: string;
  notes: string | null;
};

export default function TerrainAreaCard({ area }: { area: TerrainArea }) {
  return (
    <Link href={`/terrain-areas/${area.slug}`} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.name}>{area.name}</span>
        <span className={`${styles.status} ${area.status.toLowerCase() === 'open' ? styles.open : styles.closed}`}>
          {area.status}
        </span>
      </div>
      {area.notes && <p className={styles.notes}>{area.notes}</p>}
    </Link>
  );
}
