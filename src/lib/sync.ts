import { query } from '@/lib/db';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export async function syncAlta(): Promise<void> {
  const res = await fetch('https://www.alta.com/lift-terrain-status', {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; RopeDropBot/1.0; +https://github.com/jstrain16/RopeDrop)',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch Alta page: ${res.status}`);
  }

  const html = await res.text();
  const scriptMatch = html.match(/window\.Alta\.liftStatus\s*=\s*({.*?});/s);
  if (!scriptMatch) {
    throw new Error('Could not find window.Alta.liftStatus in page');
  }

  const data = JSON.parse(scriptMatch[1]);

  const lifts = data.lifts || [];
  for (const lift of lifts) {
    const name = lift.name || lift.liftName || 'Unknown';
    const status = lift.status || 'Closed';
    const isOpen = status.toLowerCase() === 'open';
    const capacity = lift.capacity ? parseInt(lift.capacity, 10) : null;
    const openingAt = lift.openingAt || lift.opening_at || null;
    const closingAt = lift.closingAt || lift.closing_at || null;
    const slug = slugify(name);

    // Upsert lift
    const existing = await query<{ id: number; is_open: boolean }>(
      `SELECT id, is_open FROM lifts WHERE slug = $1`,
      [slug]
    );

    if (existing.length > 0) {
      // If is_open changed, record history (optional per schema; we don't have lift history table, so skip)
      await query(
        `UPDATE lifts
         SET name = $1, capacity = $2, opening_at = $3, closing_at = $4, is_open = $5, last_updated_at = NOW()
         WHERE slug = $2`,
        [name, capacity, openingAt, closingAt, isOpen, slug]
      );
    } else {
      await query(
        `INSERT INTO lifts (name, slug, capacity, opening_at, closing_at, is_open, last_updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [name, slug, capacity, openingAt, closingAt, isOpen]
      );
    }
  }

  // TODO: sync terrain areas and trails from data if available
}
