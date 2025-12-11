-- Core entities
CREATE TABLE IF NOT EXISTS lifts (
  id              integer PRIMARY KEY,
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  capacity        integer,
  opening_at      text,
  closing_at      text,
  is_open         boolean NOT NULL,
  last_updated_at timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS terrain_areas (
  id              integer PRIMARY KEY,
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  status          text NOT NULL,
  notes           text,
  last_updated_at timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS access_gates (
  id              integer PRIMARY KEY,
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  is_open         boolean NOT NULL,
  last_updated_at timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trails (
  id              integer PRIMARY KEY,
  lift_id         integer REFERENCES lifts(id),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  difficulty      text,
  status          text NOT NULL,
  is_open         boolean NOT NULL,
  is_groomed      boolean NOT NULL,
  last_updated_at timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- History
CREATE TABLE IF NOT EXISTS trail_status_history (
  id         bigserial PRIMARY KEY,
  trail_id   integer REFERENCES trails(id),
  old_status text,
  new_status text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS terrain_area_status_history (
  id              bigserial PRIMARY KEY,
  terrain_area_id integer REFERENCES terrain_areas(id),
  old_status      text,
  new_status      text NOT NULL,
  changed_at      timestamptz NOT NULL DEFAULT now()
);

-- Users and preferences
CREATE TABLE IF NOT EXISTS app_users (
  id         uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_terrain_area_prefs (
  user_id         uuid REFERENCES app_users(id),
  terrain_area_id integer REFERENCES terrain_areas(id),
  notify_enabled  boolean NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, terrain_area_id)
);

CREATE TABLE IF NOT EXISTS user_trail_prefs (
  user_id        uuid REFERENCES app_users(id),
  trail_id       integer REFERENCES trails(id),
  notify_enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, trail_id)
);

-- Notification queue
CREATE TABLE IF NOT EXISTS pending_notifications (
  id           bigserial PRIMARY KEY,
  user_id      uuid REFERENCES app_users(id),
  entity_type  text NOT NULL,
  entity_id    integer NOT NULL,
  old_status   text,
  new_status   text NOT NULL,
  event_at     timestamptz NOT NULL DEFAULT now(),
  processed    boolean NOT NULL DEFAULT false,
  processed_at timestamptz
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_trails_lift_id ON trails(lift_id);
CREATE INDEX IF NOT EXISTS idx_trail_history_trail_id ON trail_status_history(trail_id);
CREATE INDEX IF NOT EXISTS idx_terrain_history_area_id ON terrain_area_status_history(terrain_area_id);
CREATE INDEX IF NOT EXISTS idx_pending_notifications_processed ON pending_notifications(processed);

