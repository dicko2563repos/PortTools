# Design language — PortTools apps

**Implementation source of truth:** `@porttools/ui` in `PortTools/packages/ui`.  
Change shared components there; apps consume via `file:../PortTools/packages/ui`.

Reference app: **Compliance-Web** (`pcr.porttools.com.au`).

## Branding

**Organisation line (primary):** Precision Aviation Services  
**Product line (secondary):** App-specific name (e.g. Port Compliance Record)

Landing / login title pattern:

```
Precision Aviation Services     ← text-3xl/4xl font-bold text-slate-900
Port Compliance Record          ← text-xl/2xl font-medium text-slate-600
```

Center titles on marketing/login pages unless the app needs a different layout.

## Colour palette

| Use | Tailwind |
|-----|----------|
| Page background | `bg-slate-100` / `#f1f5f9` |
| Body text | `text-slate-900`, muted `text-slate-600` |
| Primary button | `bg-slate-900 text-white hover:bg-slate-800 rounded-lg` |
| Secondary button | `border border-slate-300 hover:bg-white rounded-lg` |
| Cards | `rounded-xl border border-slate-200 bg-white shadow-sm` |
| Section headers | `bg-slate-50/80`, `text-sm font-semibold` |

### Status colours (data grids — when applicable)

Use `@compliance/rules` status tokens or equivalent:

| Status | Meaning | Label |
|--------|---------|--------|
| Green | Has value | **Completed** |
| Yellow | Not yet due | Not yet due |
| Orange | Due now | Due now |
| Red | Overdue empty | Overdue |

Do not rename "Completed" back to "Filled" in user-facing copy.

## Typography

- System UI stack: `system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
- Grid cell values: `text-xs tabular-nums` for dates/numbers
- Prefer accessible contrast; avoid relying on colour alone (include labels in legend)

## Login pages

Standard layout:

1. Link back to home (`← Home`)
2. Heading (Port login / Admin login)
3. Short helper line for port login if needed
4. Form: port code + password **or** admin email + password
5. **Forgot password?** → mailto `NEXT_PUBLIC_SUPPORT_EMAIL` (see Compliance-Web `ForgotPasswordHelp`)

Auth model:

- **Port:** shared password per port (not per user)
- **Admin:** email + password
- Password reset: admin/support manual reset (no self-service email yet)

## Page width

- Record / data-heavy views: **full viewport width** (`w-full`), sensible horizontal padding (`px-4 sm:px-6`)
- Marketing home: centered column `max-w-lg` is fine
- Tables: fluid on wide screens; horizontal scroll only below minimum readable width (see Compliance-Web `globals.css` `--compliance-*` variables as reference)

## Support contact

Default: **kgc@precisionaviation.com.au** (`NEXT_PUBLIC_SUPPORT_EMAIL`)

## New app checklist

- [ ] Uses `@porttools/ui` (`AppHomeLinks`, `HubHome`, `LoginForm`, `ForgotPasswordHelp`, `Button`, `Input`)
- [ ] Landing page uses PAS + product name pattern
- [ ] Port / Admin login routes match naming (`/login/port`, `/login/admin`) unless app has no port users
- [ ] Primary/secondary buttons match above
- [ ] Forgot-password points at support email
- [ ] Favicon and `<title>` set (shared `icon.svg` with PT mark on hub and apps)
- [ ] Production on HTTPS only (session cookies use `Secure` in production)
