# PortTools Access register

Manager login for staff ASIC and FOB registers at **https://access.porttools.com.au**.

## Local dev

From PortTools repo root:

```powershell
npm install
npm run dev:access
```

Open http://localhost:3003

## Vercel

- Root directory: `apps/access`
- Env: `DATABASE_URL` (porttools + movements schemas), `SESSION_SECRET`

## DNS

CNAME `access` → Vercel
