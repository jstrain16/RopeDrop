'use client';

import Link from 'next/link';
import styles from './LiftCard.module.css';

type Lift = {
  id: number;
  name: string;
  slug: string;
  is_open: boolean;
};

export default function LiftCard({ lift }: { lift: Lift }) {
  return (
    <Link href={`/lifts/${lift.slug}`} className={styles.card}>
      <div className={styles.header}>
        <span className={styles.name}>{lift.name}</span>
        <span className={`${styles.status} ${lift.is_open ? styles.open : styles.closed}`}>
          {lift.is_open ? 'Open' : 'Closed'}
        </span>
      </div>
    </Link>
  );
}
