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
| **Subdomain** | `movements.porttools.com.au` |
| **Repo** | `C:\Projects\Movements-Web` |
| **Database** | Supabase (separate from PCR for v1) |
| **Users** | Port (bi-weekly movement entry), Admin (ports/passwords) |
| **Status** | Dev |
| **Docs** | `Movements-Web/docs/movements-rules-spec.md`, `memory-bank/` |
| **Excel ref** | `Port Movement Summary.xlsm` in OneDrive Recording folder |

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
| **Repo** | Planned: `PortTools/apps/hub` or static site in this folder |
| **Status** | Not started |
| **See** | `auth-roadmap.md` |

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
