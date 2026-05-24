# Apps registry

Update when adding or retiring a PortTools app.

## PCR — Port Compliance Record

| Field | Value |
|-------|--------|
| **Name** | Port Compliance Record |
| **Subdomain** | `pcr.porttools.com.au` |
| **Repo** | `C:\Projects\Compliance-Web` |
| **GitHub** | dicko2563repos/Compliance-Web |
| **Vercel** | Compliance-Web project |
| **Database** | Supabase (production) |
| **Users** | Port (grid entry), Admin (ports, templates, import/export) |
| **Status** | Live (pilot) |
| **Docs** | `Compliance-Web/docs/`, `memory-bank/` |

## Port Movement Summary (PMS)

| Field | Value |
|-------|--------|
| **Name** | Port Movement Summary |
| **Subdomain** | `pms.porttools.com.au` |
| **Repo** | `C:\Projects\Movements-Web` |
| **Database** | Shared Supabase with PCR; schema `movements` |
| **Users** | Port (bi-weekly movement entry), Admin (ports/passwords), Reports (cross-port read-only) |
| **Status** | Live |
| **Docs** | `Movements-Web/docs/movements-rules-spec.md`, `memory-bank/` |
| **Excel ref** | `Port Movement Summary.xlsm` in OneDrive Recording folder |

| **Notes** | Reports login: `pms.porttools.com.au/login/reports` — linked from hub |

## PTS Calc

| Field | Value |
|-------|--------|
| **Name** | PTS Calc |
| **Subdomain** | `ptscalc.porttools.com.au` |
| **Repo** | *(add local path when available)* |
| **Status** | Live |
| **Notes** | Separate codebase; align UI with `design-language.md` when touching UI |

## Hub — porttools.com.au

| Field | Value |
|-------|--------|
| **Name** | PortTools Hub |
| **Subdomain** | `porttools.com.au` / `www` |
| **Repo** | `PortTools/apps/hub` (same GitHub repo as shared packages) |
| **GitHub** | dicko2563repos/PortTools |
| **Vercel** | Separate project; root directory `apps/hub` |
| **Database** | None (v1) |
| **Users** | Public landing — links only |
| **Status** | Ready to deploy |
| **See** | `apps/hub/README.md`, `auth-roadmap.md` |

## Admin console — admin.porttools.com.au

| Field | Value |
|-------|--------|
| **Name** | PortTools Admin console |
| **Subdomain** | `admin.porttools.com.au` |
| **Repo** | `PortTools/apps/admin` (same GitHub repo as shared packages) |
| **Database** | Supabase — `porttools` schema |
| **Users** | Platform admins |
| **Status** | Dev — managers panel + admin accounts |
| **See** | `apps/admin/README.md` |

## Access register — access.porttools.com.au

| Field | Value |
|-------|--------|
| **Name** | PortTools Access register |
| **Subdomain** | `access.porttools.com.au` |
| **Repo** | `PortTools/apps/access` |
| **Database** | Supabase — `porttools` + `movements` (FOB/ASIC data) |
| **Users** | Port managers (assigned ports) |
| **Status** | Dev |
| **See** | `apps/access/README.md`, `Movements-Web/docs/access-register-spec.md` |

## Template (copy for new app)

```markdown
## App name

| Field | Value |
|-------|--------|
| **Name** | |
| **Subdomain** | |
| **Repo** | |
| **GitHub** | |
| **Vercel** | |
| **Database** | |
| **Users** | |
| **Status** | Dev / Live |
| **Notes** | |
```
