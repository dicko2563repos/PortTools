# PortTools — Precision Aviation platform

Shared docs for web apps at **porttools.com.au** (subdomains per app).

## Apps

| App | Subdomain | Repo | Status |
|-----|-----------|------|--------|
| Port Compliance Record (PCR) | [pcr.porttools.com.au](https://pcr.porttools.com.au) | `../Compliance-Web` | Live |
| Port Movement Summary (PMS) | [pms.porttools.com.au](https://pms.porttools.com.au) | `../Movements-Web` | Live |
| PTS Calc | [ptscalc.porttools.com.au](https://ptscalc.porttools.com.au) | *(separate — add path when local)* | Live |
| Hub / landing | [porttools.com.au](https://porttools.com.au) *(deploy pending)* | `apps/hub` in this repo | Ready |

## Docs (read before new UI or auth work)

| Doc | Purpose |
|-----|---------|
| [docs/platform-brief.md](docs/platform-brief.md) | Organisation, hosting, support, multi-app strategy |
| [docs/design-language.md](docs/design-language.md) | Shared look and feel (Tailwind, login, titles) |
| [docs/auth-roadmap.md](docs/auth-roadmap.md) | Per-app login today → hub SSO later |
| [docs/apps-registry.md](docs/apps-registry.md) | Registry template for each app |

## Cursor workflow

1. Open **`C:\Projects\PortTools-Platform.code-workspace`** (Compliance-Web + Movements-Web + this submodule).
2. **Edit PortTools here** (`Compliance-Web/PortTools` when using that workspace). See **`Compliance-Web/docs/porttools-git-workflow.md`** for push order.
3. Each app repo has `.cursor/rules/` — platform rule points here.
4. New app: copy design-language patterns from Compliance-Web; register in `apps-registry.md`.

> **Do not** maintain a separate clone at `C:\Projects\PortTools` — it duplicates this repo and breaks GitHub Desktop pushes.

## Hosting pattern (current)

- **DNS:** VentraIP VIPcontrol — `porttools.com.au`, one subdomain per app
- **App host:** Vercel (Next.js)
- **Database:** Supabase Postgres (per app or shared — document per app)
- **Support:** kgc@precisionaviation.com.au
