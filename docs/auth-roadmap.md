# Auth roadmap — PortTools

## Today (per app)

Each app implements its own login:

| App | Port login | Admin login | Session |
|-----|------------|-------------|---------|
| PCR (Compliance-Web) | Port code + password | Email + password | JWT cookie `compliance_session` |
| PTS Calc | *(document in that repo)* | *(if any)* | *(document in that repo)* |

Port passwords are **shared per port**; reset via admin panel or support (see PCR Admin → Edit port).

Forgot password UX: link to **kgc@precisionaviation.com.au** (Option A — no email self-service yet).

## Phase B — Admin self-service *(optional, per app)*

Logged-in admin can change own password (current + new). Still no email reset.

## Phase C — Email reset *(optional)*

SMTP or provider for admin accounts only; port users still admin-reset.

## Hub landing *(planned)*

**URL:** `https://porttools.com.au` (or `www`)

Static or minimal Next site:

- PAS branding
- Cards/links: PCR, PTS Calc, future apps
- No login yet — links open each subdomain

## Unified port login *(future)*

**Goal:** User logs in once at hub (or any app), accesses all apps as that port.

Constraints to preserve:

- Same port codes/passwords across apps **only if** product decides shared credential store (today: **per-app database**)
- Cookie domain: `.porttools.com.au` requires shared `SESSION_SECRET` and compatible JWT payload **or** central auth API

Likely implementation path:

1. Extract shared auth package (`@porttools/auth`) from Compliance-Web
2. Shared `ports` + `port_credentials` tables **or** auth microservice
3. Hub login sets cookie on `.porttools.com.au`
4. Each app validates same cookie / calls auth service

**Do not implement SSO until hub exists and product confirms shared DB vs federated auth.**

## Agent note

When scaffolding a new app, copy **auth UX** (login pages, session shape) from Compliance-Web; use a **separate** Supabase project/database unless explicitly merging.
