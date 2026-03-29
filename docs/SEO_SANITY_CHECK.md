# SEO sanity check (Vercel + NicoPatch)

This repo is a Vite SPA with public marketing pages + private portal routes.
SEO should apply to public pages only.

## 0) Deployment prerequisites

- Vercel project imported from GitHub
- Build: `npm run build`
- Output: `dist`

## 1) Environment variables

Set in Vercel → Project → Settings → Environment Variables:

- `VITE_SITE_ORIGIN`
  - Production value: `https://nicopatch.com.au` (or your real domain)
  - Optional: set for Preview too if you want correct canonicals on preview URLs

Redeploy after changing env vars.

## 2) Indexing policy (must hold)

### Public pages (index)
- `/` `/how-it-works` `/pricing` `/about` `/contact` `/faq`
- `/guides` and `/guides/*`
- `/terms` `/privacy` `/disclaimer`

### Non-public pages (noindex)
- `/patient/*`, `/doctor/*`, `/admin/*`
- `/auth*`, `/eligibility*`

Defense in depth:
- Meta robots: `noindex, nofollow` (in-app)
- Header: `X-Robots-Tag: noindex, nofollow` (Vercel)

## 3) Spot checks (do these after deploy)

### A) Canonicals
- Visit `/` and `/guides/zyn-australia`
- View source (or inspect head) and confirm:
  - `<link rel="canonical" href="https://<domain>/<path>" />`

### B) Noindex
- Visit `/auth` and any `/patient/*` route
- Confirm meta robots is `noindex, nofollow`

### C) Headers (Vercel)
Use `curl -I` against production domain:

- `curl -I https://<domain>/auth`
- `curl -I https://<domain>/patient/dashboard`

Confirm header exists:
- `X-Robots-Tag: noindex, nofollow`

### D) robots + sitemap
- `https://<domain>/robots.txt` loads
- `https://<domain>/sitemap.xml` loads

## 4) Google Search Console

- Verify domain
- Submit sitemap: `https://<domain>/sitemap.xml`
- Watch indexing coverage and enhancements (FAQ/breadcrumb rich results)

## Notes
- Portals should NOT be indexed.
- For best SEO later, consider prerendering public routes only.
