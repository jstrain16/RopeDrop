import { PoolClient } from 'pg';
import { withTransaction } from '@/lib/db';

type EntityType = 'trail' | 'terrain_area';

export async function queueNotificationsForChange(
  client: PoolClient,
  params: { entityType: EntityType; entityId: number; oldStatus: string | null; newStatus: string },
) {
  const { entityType, entityId, oldStatus, newStatus } = params;
  const prefTable =
    entityType === 'trail' ? 'user_trail_prefs' : 'user_terrain_area_prefs';
  const prefColumn = entityType === 'trail' ? 'trail_id' : 'terrain_area_id';

  const { rows } = await client.query<{ user_id: string }>(
    `SELECT user_id FROM ${prefTable} WHERE ${prefColumn} = $1 AND notify_enabled = true`,
    [entityId],
  );

  if (!rows.length) return;

  for (const row of rows) {
    await client.query(
      `
        INSERT INTO pending_notifications (user_id, entity_type, entity_id, old_status, new_status)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [row.user_id, entityType, entityId, oldStatus, newStatus],
    );
  }
}

export async function processPendingNotifications(limit = 100) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `
        SELECT id, user_id, entity_type, entity_id, old_status, new_status, event_at
        FROM pending_notifications
        WHERE processed = false
        ORDER BY event_at ASC
        LIMIT $1
      `,
      [limit],
    );

    if (!rows.length) {
      return [];
    }

    const processedIds: number[] = [];
    for (const row of rows) {
      // Stub: this is where push/email/SMS would go.
      console.log('Pending notification (stub):', row);
      processedIds.push(row.id);
    }

    if (processedIds.length) {
      await client.query(
        `
          UPDATE pending_notifications
          SET processed = true, processed_at = now()
          WHERE id = ANY($1::bigint[])
        `,
        [processedIds],
      );
    }

    return processedIds;
  });
}

