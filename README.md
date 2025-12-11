# Alta Eyes

Next.js API + Supabase/Postgres schema + Expo client for Alta terrain status, change detection, and notification preferences.

## Prereqs
- Node 20+
- Postgres (Supabase connection string works)
- npm

## Environment
Copy `docs.env.example` to `.env.local` (and `mobile/.env` if desired):
```
DATABASE_URL=postgres://user:password@host:5432/db
CRON_SECRET=replace-me
DEMO_USER_ID=00000000-0000-0000-0000-000000000000
API_BASE_URL=http://localhost:3000
```

## Database
Run migrations (raw SQL):
```
npm run db:migrate
```

Tables: lifts, trails, terrain_areas, access_gates, history tables, app_users, prefs, pending_notifications.

## Backend (Next.js)
- Dev server: `npm run dev`
- Cron endpoints (require `x-cron-secret` header):
  - `POST /api/internal/sync` — fetch Alta HTML, upsert entities, record history, queue notifications
  - `POST /api/internal/process-pending` — stub processor, marks pending_notifications as processed
- Public endpoints:
  - `GET /api/status/overview`
  - `GET /api/lifts/:slug`
  - `GET /api/trails/:slug`
  - `GET /api/terrain-areas/:slug`
  - Prefs (expects `x-user-id` header or `userId` query, falls back to DEMO_USER_ID):
    - `GET /api/me/preferences`
    - `POST /api/me/preferences/terrain-areas/:id` `{ "notify_enabled": bool }`
    - `POST /api/me/preferences/trails/:id` `{ "notify_enabled": bool }`

### Manual sync
```
curl -X POST http://localhost:3000/api/internal/sync -H "x-cron-secret:$CRON_SECRET"
```

## Mobile (Expo)
Located in `mobile/`.
```
cd mobile
npm install
npm start
```
Environment for mobile (optional in `mobile/.env`):
```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_DEMO_USER_ID=00000000-0000-0000-0000-000000000000
```
Screens:
- Home: overview + favorites
- Terrain area detail: status + notify toggle
- Trail detail: status/history + notify toggle
- Settings: list/toggle enabled notifications

## Notes
- Scraper respects Alta front-end: parses `window.Alta.liftStatus` from the public page with a custom User-Agent.
- Notification delivery is stubbed; only queueing + processed flag are implemented.
