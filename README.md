# Alta Eyes

Next.js API + Supabase/Postgres app for Alta terrain status, change detection, and notification preferences.

## Features

- Syncs Alta lift & terrain status (via scraping)
- Stores history of status changes
- User notification preferences (per terrain area & trail)
- Mobile app (Expo) and responsive web UI

## Tech

- Next.js 16 (App Router)
- PostgreSQL (Supabase)
- React 19 + TanStack Query (mobile)
- Cheerio for scraping

## Setup

1. Create a Supabase project, run migrations (`npm run db:migrate`).
2. Copy `.env.local.example` to `.env.local` and fill values:
   - `DATABASE_URL`: Supabase Postgres connection.
   - `CRON_SECRET`: random string for internal endpoints.
   - `DEMO_USER_ID`: a UUID for demo user (create a row in `app_users`).
   - `API_BASE_URL`: your deployment URL (e.g., `https://your-site.vercel.app`).
3. Install deps: `npm install`.
4. Run dev: `npm run dev`.
5. Deploy to Vercel (or any Node host). Set environment variables there.

## Cron

Two internal endpoints must be called regularly:

- `POST /api/internal/sync` – fetch Alta status and upsert lifts/terrain areas. Set up GitHub Actions workflow in `.github/workflows/sync.yml` (included). Add `API_BASE_URL` and `CRON_SECRET` as GitHub repo secrets.
- `POST /api/internal/process-pending` – dispatch notifications (stub). Enable when you integrate a notification channel.

## Database

Tables: lifts, terrain_areas, trails, history tables, app_users, preferences, pending_notifications.

See `db/migrations/0001_init.sql`.

## API

Public endpoints:

- `GET /api/status/overview` – lifts & terrain areas list
- `GET /api/lifts/[slug]` – lift details + trails
- `GET /api/trails/[slug]` – trail details + history
- `GET /api/terrain-areas/[slug]` – area details + history
- `GET /api/me/preferences` – current user's notification prefs
- `POST /api/me/preferences/terrain-areas/[id]` – set terrain prefs
- `POST /api/me/preferences/trails/[id]` – set trail prefs

Mobile expects `DEMO_USER_ID` header fallback.

## Web UI

Responsive pages built with server components:

- `/`: overview
- `/lifts/[slug]`: lift detail with trails
- `/trails/[slug]`: trail detail with lift link
- `/terrain-areas/[slug]`: area detail with history
- `/settings`: user preferences (read-only now)

## License

MIT
