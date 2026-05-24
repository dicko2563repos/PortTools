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
