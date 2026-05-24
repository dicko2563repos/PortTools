# PortTools Admin console

Central admin login at **https://admin.porttools.com.au** — manager accounts, platform admins, and (future) PCR/PMS admin tabs.

## Local dev

From PortTools repo root:

```powershell
npm install
npm run dev:admin
```

Open http://localhost:3002

## Vercel

- Root directory: `apps/admin`
- Install: `cd ../.. && npm install`
- Env: `DATABASE_URL`, `SESSION_SECRET`, optional Resend for forgot-password
- **Create port** provisions `porttools`, `public`, and `movements` rows (via `@porttools/auth`)

## DNS

CNAME `admin` → Vercel
