# Operator portal — unified port login

Phase 1 of the operator portal at **porttools.com.au**.

## Goal

One email + password per port at the hub. After login, a tabbed portal links to PCR, PMS, and Access register. Reports users use the same login form and see reports-only content.

Platform admin stays at **admin.porttools.com.au**.

## Phase 1 (shipped)

- `porttools.ports.login_email` — unique port operator email
- `porttools.ports.reminders_enabled` — flag for future compliance reminder cron
- Hub login at `/` → `/portal` with tabs (deep links to existing apps)
- Shared session cookie `porttools_session` on `.porttools.com.au` (JWT, 7 days)
- Admin console: login email required when creating a port
- PCR/PMS port **code** login unchanged on each app home page

## Phase 2 (this release)

- PCR, PMS, and Access read `porttools_session` when the app cookie is absent — portal tabs open signed in
- Hub portal copy updated (no separate login for port operators)
- Access: port-operator sessions skip the tab-session gate; manager login unchanged

## Phase 3 (planned)

- Embed app UIs in hub tabs (or reverse proxy)
- Access register PIN gate instead of manager login
- Compliance reminder cron emails when `reminders_enabled`

## Database migration

```bash
# From Compliance-Web or Movements-Web
npm run db:migrate:deploy
```

Migration: `20260524220000_port_login_email`

**Existing ports:** set login email via Admin API PATCH or SQL:

```sql
UPDATE porttools.ports SET login_email = 'ops@example.com' WHERE code = 'KGC';
```

## Hub Vercel env

| Variable | Required |
|----------|----------|
| `DATABASE_URL` | Yes — same Supabase project (`porttools` + `public` + `movements` schemas) |
| `SESSION_SECRET` | Yes — same value as other PortTools apps |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | Recommended — login rate limit |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional |

## Local dev

```powershell
cd Compliance-Web/PortTools
npm install
npm run dev:hub
```

Copy `apps/hub/.env.example` → `apps/hub/.env` (DATABASE_URL, SESSION_SECRET).

Open http://localhost:3000 — cookie domain is omitted on localhost.
