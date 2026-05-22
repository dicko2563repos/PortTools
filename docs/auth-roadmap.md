# Auth roadmap — PortTools

## Today (Option 2 — shared credentials)

PCR and Movements share login **credentials** in Supabase schema **`porttools`** (not `auth` — that name is reserved on Supabase).

| Store | Tables |
|-------|--------|
| Shared | `porttools.ports`, `porttools.port_credentials`, `porttools.admins` |
| PCR app data | `public.ports`, compliance records, … |
| Movements app data | `movements.ports`, movement years, … |

| App | Port login | Admin login | Session (still per app) |
|-----|------------|-------------|-------------------------|
| PCR | Port code + password | Email + password | JWT cookie `compliance_session` |
| Movements | Same password as PCR | Same admin as PCR | JWT cookie `movements_session` |
| PTS Calc | *(no login)* | — | — |

Package: **`@porttools/auth`** (`PortTools/packages/auth`) — password hashing + auth store helpers.

Deploy: see `Compliance-Web/docs/shared-auth.md`.

Port passwords are **shared per port** across PCR and Movements; reset via admin in either app updates `porttools.port_credentials`.

Forgot password UX: link to **kgc@precisionaviation.com.au** (Option A — no email self-service yet).

## Phase B — Admin self-service *(optional, per app)*

Logged-in admin can change own password (current + new). Still no email reset.

## Phase C — Email reset *(optional)*

SMTP or provider for admin accounts only; port users still admin-reset.

## Hub landing *(planned)*

**URL:** `https://porttools.com.au` (or `www`)

Static or minimal Next site:

- PAS branding
- Cards/links: PCR, Movements, PTS Calc (no login for calc)
- No login yet — links open each subdomain

## Unified port login — Option 3 *(future)*

**Goal:** User logs in once at hub (or any app), accesses all apps as that port.

Likely steps after Option 2:

1. Hub login sets cookie on `.porttools.com.au`
2. Same `SESSION_SECRET` across Vercel projects
3. Compatible JWT payload; Movements `unlockedPeriodIds` moved to DB or app cookie
4. Each app validates shared cookie / retires per-app login pages

**Do not implement SSO until hub exists and Option 2 is stable in production.**

## Agent note

When scaffolding a new PortTools app that needs login:

- Add `@porttools/auth` and Prisma models for **`porttools`** schema
- App-local `ports` table for FKs; join on **`code`** at login
- Use a **separate session cookie name** until Option 3 SSO
- Do not duplicate `port_credentials` or `admins` in app schemas
