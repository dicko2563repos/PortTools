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

## Phase B — Admin self-service *(done)*

Logged-in admin can change own password (current + new) on PCR and PMS admin pages. Updates `porttools.admins` via `@porttools/auth` `changeAdminPassword`. Still no email reset.

## Phase C — Admin email reset *(done)*

Self-service admin forgot-password when **Resend** is configured (`RESEND_API_KEY`, `EMAIL_FROM`):

- `/login/admin/forgot` — request reset link (1 hour, rate limited)
- `/login/admin/reset?token=…` — set new password
- Works on PCR and PMS; updates shared `porttools.admins`

Without Resend, login page falls back to support mailto and another admin resetting the password in **Admin accounts**.

## Phase D — Admin account management *(done)*

Logged-in admin can list, add, reset password, and remove admin accounts (cannot remove self or the last admin). Shared `porttools.admins` across PCR and PMS.

## Hub landing *(v1 — done)*

**URL:** `https://porttools.com.au` (or `www`)

Next.js app: **`PortTools/apps/hub`** (`@porttools/hub`), deploy as separate Vercel project.

- PAS branding + **PortTools** product line
- Cards/links: PCR, PMS, Access register, Admin console, PTS Calc
- Support mailto footer

See `apps/hub/README.md` for Vercel + DNS setup.

## Admin & Access consoles *(v1 — started)*

| App | URL | Users |
|-----|-----|--------|
| **Admin console** | `admin.porttools.com.au` | Platform admins — admin accounts, manager accounts |
| **Access register** | `access.porttools.com.au` | Port **managers** — staff ASIC + FOB (assigned ports only) |

- Manager identity: `porttools.managers` + `porttools.manager_port_access` (Option A)
- PCR/PMS app home pages: **port login only** (PMS also offers reports login); admin login removed from operator apps
- Operator app `/login/admin` redirects to Admin console

Deploy: `PortTools/apps/admin`, `PortTools/apps/access` as separate Vercel projects.

Port create (Admin console, PCR admin, or PMS admin) uses `@porttools/auth` **`provisionPortEverywhere`** — writes `porttools`, `public.ports`, and `movements.ports` in one transaction (matched by **code**).

## Unified port login — Option 3 *(shipped May 2026)*

**Phase 1 (hub):** `porttools.com.au` login with port **login email** + password; tabbed portal; shared cookie `porttools_session` on `.porttools.com.au`. See `docs/operator-portal.md`.

**Phase 2 (shipped):** PCR/PMS auto-login from shared cookie; hub iframe embeds; Access PIN for port staff; manager ASIC/compliance email reminders (manager opt-in). Hub manager iframe skips Access tab gate when `porttools_session` is present.

**Phase 3 (future):** Retire legacy per-app login pages where safe; optional Outlook calendar integration for ASIC expiry.

## Direct PCR/PMS login — stay signed in *(shipped)*

Port staff logging in on **`pcr.porttools.com.au`** or **`pms.porttools.com.au`** only:

- Default: **session cookie** + tab-session gate (closing the tab signs out). No `porttools_session` SSO cookie.
- Optional checkbox **“Stay signed in until next Monday?”** — app cookie until next Monday 00:00 **Australia/Brisbane**; no tab gate.
- Managers, reports, and **hub** login unchanged (full login each visit / hub tab session).

Original Option 3 steps (completed):

1. Hub login sets cookie on `.porttools.com.au`
2. Same `SESSION_SECRET` across Vercel projects
3. Compatible JWT payload; Movements `unlockedPeriodIds` in app cookie
4. Each app validates shared cookie alongside app session

## Agent note

When scaffolding a new PortTools app that needs login:

- Add `@porttools/auth` and Prisma models for **`porttools`** schema
- App-local `ports` table for FKs; join on **`code`** at login
- Use a **separate session cookie name** until Option 3 SSO
- Do not duplicate `port_credentials` or `admins` in app schemas
