import { PoolClient } from 'pg';
import { withTransaction } from '@/lib/db';
import { getCurrentAltaStatus } from './scraper';
import { queueNotificationsForChange } from './notifications';
import {
  CurrentAccessGate,
  CurrentAltaStatus,
  CurrentLift,
  CurrentTerrainArea,
  CurrentTrail,
} from './types';

function toTimestamp(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return new Date();
  }
  return date;
}

async function upsertLift(client: PoolClient, lift: CurrentLift) {
  await client.query(
    `
      INSERT INTO lifts (id, name, slug, capacity, opening_at, closing_at, is_open, last_updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        capacity = EXCLUDED.capacity,
        opening_at = EXCLUDED.opening_at,
        closing_at = EXCLUDED.closing_at,
        is_open = EXCLUDED.is_open,
        last_updated_at = EXCLUDED.last_updated_at
    `,
    [
      lift.id,
      lift.name,
      lift.slug,
      lift.capacity,
      lift.openingAt,
      lift.closingAt,
      lift.isOpen,
      toTimestamp(lift.updatedAt),
    ],
  );
}

async function upsertAccessGate(client: PoolClient, gate: CurrentAccessGate) {
  await client.query(
    `
      INSERT INTO access_gates (id, name, slug, is_open, last_updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        is_open = EXCLUDED.is_open,
        last_updated_at = EXCLUDED.last_updated_at
    `,
    [gate.id, gate.name, gate.slug, gate.isOpen, toTimestamp(gate.updatedAt)],
  );
}

async function upsertTrail(client: PoolClient, trail: CurrentTrail) {
  const existing = await client.query<{ status: string }>('SELECT status FROM trails WHERE id = $1', [
    trail.id,
  ]);
  const previousStatus = existing.rows[0]?.status ?? null;
  const statusChanged = previousStatus !== null && previousStatus !== trail.status;

  await client.query(
    `
      INSERT INTO trails (id, lift_id, name, slug, difficulty, status, is_open, is_groomed, last_updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        lift_id = EXCLUDED.lift_id,
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        difficulty = EXCLUDED.difficulty,
        status = EXCLUDED.status,
        is_open = EXCLUDED.is_open,
        is_groomed = EXCLUDED.is_groomed,
        last_updated_at = EXCLUDED.last_updated_at
    `,
    [
      trail.id,
      trail.liftId,
      trail.name,
      trail.slug,
      trail.difficulty,
      trail.status,
      trail.isOpen,
      trail.isGroomed,
      toTimestamp(trail.updatedAt),
    ],
  );

  if (statusChanged) {
    await client.query(
      `INSERT INTO trail_status_history (trail_id, old_status, new_status) VALUES ($1, $2, $3)`,
      [trail.id, previousStatus, trail.status],
    );
    await queueNotificationsForChange(client, {
      entityType: 'trail',
      entityId: trail.id,
      oldStatus: previousStatus,
      newStatus: trail.status,
    });
  }
}

async function upsertTerrainArea(client: PoolClient, area: CurrentTerrainArea) {
  const existing = await client.query<{ status: string }>(
    'SELECT status FROM terrain_areas WHERE id = $1',
    [area.id],
  );
  const previousStatus = existing.rows[0]?.status ?? null;
  const statusChanged = previousStatus !== null && previousStatus !== area.status;

  await client.query(
    `
      INSERT INTO terrain_areas (id, name, slug, status, notes, last_updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        last_updated_at = EXCLUDED.last_updated_at
    `,
    [area.id, area.name, area.slug, area.status, area.notes, toTimestamp(area.updatedAt)],
  );

  if (statusChanged) {
    await client.query(
      `INSERT INTO terrain_area_status_history (terrain_area_id, old_status, new_status) VALUES ($1, $2, $3)`,
      [area.id, previousStatus, area.status],
    );
    await queueNotificationsForChange(client, {
      entityType: 'terrain_area',
      entityId: area.id,
      oldStatus: previousStatus,
      newStatus: area.status,
    });
  }
}

function collectTrails(status: CurrentAltaStatus): CurrentTrail[] {
  return status.lifts.flatMap((lift) => lift.runs || []);
}

export async function syncAltaStatusAndQueueChanges() {
  const status = await getCurrentAltaStatus();
  await withTransaction(async (client) => {
    for (const lift of status.lifts) {
      await upsertLift(client, lift);
    }

    const trails = collectTrails(status);
    for (const trail of trails) {
      await upsertTrail(client, trail);
    }

    for (const area of status.terrainAreas) {
      await upsertTerrainArea(client, area);
    }

    for (const gate of status.accessGates) {
      await upsertAccessGate(client, gate);
    }
  });
}

