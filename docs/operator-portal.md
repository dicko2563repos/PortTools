# Operator portal — unified port login

Phase 1 of the operator portal at **porttools.com.au**.

## Goal

One email + password per port at the hub. After login, a tabbed portal links to PCR, PMS, and Access register. Reports users use the same login form and see reports-only content.

Platform admin stays at **admin.porttools.com.au**.

## Phase 1 (shipped)

- `porttools.ports.login_email` — unique port operator email
- `porttools.ports.reminders_enabled` — flag for future compliance reminder cron
- Hub login at `/` → `/portal` with tabs (deep links to existing apps)
- Shared session cookie `porttools_session` on `.porttools.com.au` (browser session cookie; JWT backstop 24h)
- Admin console: login email required when creating a port
- PCR/PMS port **code** login unchanged on each app home page

## Phase 2 (shipped)

- PCR, PMS, and Access read `porttools_session` when the app cookie is absent — portal tabs open signed in
- Hub portal embeds each app in a tab (`iframe`); **Open in new tab** link in header
- Hub tab-session gate — closing the browser tab/window requires login again (same pattern as admin/access)
- Access: port-operator sessions skip the access tab gate; manager login unchanged

## Phase 3 (shipped)

- **Access register PIN** — admin sets a numeric PIN per port; hub port operators enter it before the register loads (managers using access.porttools.com.au skip the PIN)
- **Unified login** — one form on hub, PCR, PMS, and Access:
  - Staff: **port code** + shared password
  - Managers: **port login email** + manager password (same permissions as staff; multi-port switcher in hub portal)
  - Reports: reports email + password → PMS reports (or hub reports tab)
  - Sets shared `porttools_session` on `.porttools.com.au` (Option A SSO)
- Compliance reminder cron emails when `reminders_enabled` (planned)

## Database migration

```bash
# From Compliance-Web or Movements-Web
npm run db:migrate:deploy
```

Migration: `20260524220000_port_login_email`

**Existing ports:** set login email via Admin API PATCH or SQL. Set access PIN in the admin console (Ports section) or PATCH with `accessPin`.

```sql
UPDATE porttools.ports SET login_email = 'ops@example.com' WHERE code = 'KGC';
```

Migration: `20260525180000_port_access_pin` (run `npm run db:migrate:deploy` from Compliance-Web or Movements-Web)

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
