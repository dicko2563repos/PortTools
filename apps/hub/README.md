# PortTools Hub

Static landing at **https://porttools.com.au** — links to PCR, PMS, and PTS Calc. No login on the hub itself.

## Local dev

From the PortTools repo root:

```powershell
npm install
npm run dev:hub
```

Open http://localhost:3000

## Vercel deploy (first time)

1. **New project** in Vercel → import the **PortTools** GitHub repo.
2. **Root Directory:** `apps/hub`
3. **Framework:** Next.js (auto-detected)
4. **Build command:** `npm run build` (default)
5. **Install command:** `npm install` (runs from repo root when Root Directory is set — Vercel installs from monorepo root)
6. **Production domain:** `porttools.com.au` and optionally `www.porttools.com.au`

No database or `SESSION_SECRET` required for v1.

## DNS (VentraIP)

Add records for the apex domain (if not already present):

| Type | Host | Value |
|------|------|--------|
| A or CNAME | `@` | Vercel apex instructions |
| CNAME | `www` | `cname.vercel-dns.com` |

Do not change existing MX records for email.

## Environment variables

Optional:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Override support mailto (default `kgc@precisionaviation.com.au`) |

App URLs are fixed in `@porttools/ui` `DEFAULT_HUB_APPS`. Override by passing `apps` to `HubHome` in `src/app/page.tsx` if needed.
