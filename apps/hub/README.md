# PortTools Hub / Operator portal

**https://porttools.com.au** — unified port and reports login, tabbed portal to PCR, PMS, and Access register.

## Local dev

From the PortTools repo root:

```powershell
npm install
# Copy apps/hub/.env.example → apps/hub/.env (DATABASE_URL, SESSION_SECRET)
npm run dev:hub
```

Open http://localhost:3000

## Vercel deploy

1. **Project** → import **PortTools** GitHub repo.
2. **Root Directory:** `apps/hub`
3. **Production domain:** `porttools.com.au` and optionally `www.porttools.com.au`

### Required env

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Supabase — must include access to `porttools`, `public`, `movements` schemas |
| `SESSION_SECRET` | Same as PCR/PMS/admin/access |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Login rate limiting |

See `docs/operator-portal.md` for migration and existing-port setup.

## DNS (VentraIP)

| Type | Host | Value |
|------|------|--------|
| A or CNAME | `@` | Vercel apex instructions |
| CNAME | `www` | `cname.vercel-dns.com` |

Do not change existing MX records for email.
