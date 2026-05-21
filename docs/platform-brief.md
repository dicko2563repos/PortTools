# Platform brief — PortTools (Precision Aviation Services)

## Purpose

Web tools for port operators and internal admin, hosted under **porttools.com.au**. Apps are developed in **separate repos** for now; this folder holds **shared product and design decisions** so they stay consistent.

## Users

| Role | Typical access |
|------|----------------|
| **Port user** | Shared port code + password per port; sees only that port's data |
| **Admin** | Separate admin login; manages ports, templates, imports, exports |
| **Support** | kgc@precisionaviation.com.au — password resets, training, pilot issues |

## Domain layout

```
porttools.com.au          → Hub / landing (future)
pcr.porttools.com.au      → Port Compliance Record (live)
movements.porttools.com.au → Port Movement Summary (dev)
ptscalc.porttools.com.au  → PTS Calc (live)
<future>.porttools.com.au → Additional apps
```

Subdomains map to **separate Vercel projects**. DNS CNAME records in VentraIP VIPcontrol.

## Standard stack (new apps)

| Layer | Choice | Notes |
|-------|--------|--------|
| Framework | Next.js (App Router), TypeScript, React | Match Compliance-Web |
| Styling | Tailwind CSS | See `design-language.md` |
| Database | Supabase Postgres | `DATABASE_URL` on Vercel |
| Auth (v1) | JWT session cookie, port + admin | Per-app; see `auth-roadmap.md` |
| Hosting | Vercel | Production env vars required |
| DNS | VentraIP | Do not break existing MX/email records |

## Multi-app strategy (2026)

| Phase | What |
|-------|------|
| **Now** | Separate repos, shared `@porttools/ui` in `PortTools/packages/` |
| **Next** | Hub landing page listing apps with links |
| **Later** | Single port login at hub → session across subdomains (`.porttools.com.au` cookie or shared auth service) |

Do **not** block app delivery on hub/SSO. New apps should use the same auth *model* (port code + password) so SSO is easier later.

## Environment variables (convention)

Per app on Vercel Production:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Supabase Postgres |
| `SESSION_SECRET` | Cookie signing (16+ chars) |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Forgot-password contact |
| `NEXT_PUBLIC_APP_URL` | Canonical HTTPS URL for the app |

## Agent / developer instructions

When working in any PortTools app:

1. Read this brief and `design-language.md`.
2. Read the app's own `memory-bank/activeContext.md`.
3. Do not copy Compliance-Web business logic into unrelated apps — only **patterns** (auth shape, UI, hosting).
4. Register the app in `apps-registry.md` when a new repo goes live.
