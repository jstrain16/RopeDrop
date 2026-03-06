import { query } from '@/lib/db';
import { extractWindowAltaScript, parseWindowAlta } from './scraper';

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
  const script = extractWindowAltaScript(html);
  const windowAltaRaw = parseWindowAlta(script);
  const windowAlta = typeof windowAltaRaw === 'object' && windowAltaRaw !== null
    ? (windowAltaRaw as Record<string, unknown>)
    : {};

  // Try common keys
  const liftStatusRaw = windowAlta['liftStatus'] || windowAlta['liftstatus'] || windowAlta['data'] || windowAlta['status'];
  if (!liftStatusRaw) {
    throw new Error('Could not find lift status data in window.Alta');
  }

  const liftStatus = liftStatusRaw as Record<string, unknown>;
  const lifts = (liftStatus.lifts || []) as unknown[];
  const terrainAreas = (liftStatus.terrainAreas || []) as unknown[];

  // Sync lifts
  for (const lift of lifts) {
    const name = (lift as any).name || (lift as any).liftName || 'Unknown';
    const status = (lift as any).status || 'Closed';
    const isOpen = status.toLowerCase() === 'open';
    const capacity = (lift as any).capacity ? parseInt((lift as any).capacity, 10) : null;
    const openingAt = (lift as any).openingAt || (lift as any).openTime || null;
    const closingAt = (lift as any).closingAt || (lift as any).closeTime || null;
    const slug = slugify(name);

    const existing = await query<{ id: number; is_open: boolean }>(
      `SELECT id, is_open FROM lifts WHERE slug = $1`,
      [slug]
    );

    if (existing.length > 0) {
      await query<any>(
        `UPDATE lifts
         SET name = $1, capacity = $2, opening_at = $3, closing_at = $4, is_open = $5, updated_at = NOW()
         WHERE slug = $6`,
        [name, capacity, openingAt, closingAt, isOpen, slug]
      );
    } else {
      await query<any>(
        `INSERT INTO lifts (name, slug, capacity, opening_at, closing_at, is_open, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [name, slug, capacity, openingAt, closingAt, isOpen]
      );
    }
  }

  // Sync terrain areas
  for (const area of terrainAreas) {
    const id = Number((area as any).id ?? (area as any).areaId ?? (area as any).area_id);
    const name = (area as any).name || (area as any).areaName || 'Unknown';
    const status = (area as any).status || (area as any).statusName || 'unknown';
    const notes = (area as any).notes ?? null;
    const slug = slugify(name);

    const existing = await query<{ id: number }>(
      `SELECT id FROM terrain_areas WHERE slug = $1`,
      [slug]
    );

    if (existing.length > 0) {
      await query<any>(
        `UPDATE terrain_areas SET name = $1, status = $2, notes = $3, updated_at = NOW() WHERE slug = $4`,
        [name, status, notes, slug]
      );
    } else {
      await query<any>(
        `INSERT INTO terrain_areas (name, slug, status, notes, updated_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [name, slug, status, notes]
      );
    }
  }

  // TODO: sync trails linking to lifts (requires more fields)
}

