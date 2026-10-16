# GDG On Campus REC — Production Deployment Checklist

**Target Domain:** `https://www.gdgrec.dev`  
**API Origin:** `https://gdg-backend-54mp.onrender.com` (proxied via `/api/*` on Vercel)  
**Date:** October 16, 2026  
**Auditor:** Senior DevOps & Production Reliability Engineer  

---

## Status Classification Legend
- **[Verified]**: Inspected, empirically tested, and confirmed functional in this repository.
- **[Fixed & Tested]**: Issues identified and repaired in code or configuration during this project; verified by automated tests.
- **[Requires Administrator Access]**: Action item that must be performed in cloud consoles (Name.com, Google Cloud Console, Google Search Console, Supabase Dashboard, Vercel/Render project settings) using privileged credentials.
- **[Not Applicable]**: Irrelevant to current architecture.
- **[Not Verified]**: Pending empirical confirmation due to lack of live environment access.

---

## 1. Vercel Configuration (Frontend Application)

| Item | Status | Verification & Action Details |
| :--- | :--- | :--- |
| **Output Directory** | **[Verified]** | Set to `dist` matching `vite.config.ts`. |
| **Build & Install Commands** | **[Verified]** | `buildCommand`: `npm run build`, `installCommand`: `npm install --legacy-peer-deps`. |
| **Client-Side Routing Rewrites** | **[Verified]** | `source: "/(.*)", destination: "/index.html"` ensures direct navigation and refreshing on `/events`, `/team`, `/about-us`, etc. resolves properly. |
| **Reverse Proxy API Rewrites** | **[Verified]** | `source: "/api/(.*)", destination: "https://gdg-backend-54mp.onrender.com/api/$1"` eliminates CORS issues on standard web browsers. |
| **Security Headers** | **[Verified]** | HSTS (`max-age=31536000; includeSubDomains; preload`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`. |
| **Content Security Policy (CSP)** | **[Fixed & Tested]** | Updated `connect-src` in `vercel.json` to include `'self' https://api.gdgrec.dev https://gdg-backend-54mp.onrender.com https://*.supabase.co https://accounts.google.com http://localhost:5000;`. |
| **Cache Headers for Assets** | **[Verified]** | `/assets/(.*)` set to `public, max-age=31536000, immutable`. |
| **Cache Headers for HTML & SEO** | **[Fixed & Tested]** | Added explicit rules: `index.html` set to `public, max-age=0, must-revalidate`; `robots.txt` & `sitemap.xml` set to `public, max-age=3600, stale-while-revalidate=86400`. |
| **Environment Variables** | **[Requires Administrator Access]** | Confirm Vercel Dashboard contains `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`. Never expose service role keys to Vercel environment variables. |

---

## 2. Render Configuration (Backend API Service)

| Item | Status | Verification & Action Details |
| :--- | :--- | :--- |
| **Runtime & Node Version** | **[Verified]** | Configured in `render.yaml` as Node.js 22. Containerized deployment in `Dockerfile` uses `node:22-bookworm-slim`. |
| **Non-Root Container Execution** | **[Verified]** | `Dockerfile` creates and runs as `USER node` to prevent container-breakout escalation. |
| **Python & Pillow Support** | **[Verified]** | `Dockerfile` installs Python 3, `libfreetype6-dev`, `libjpeg-dev`, `zlib1g-dev`, and Pillow for certificate generation. |
| **Health Check Endpoint** | **[Verified]** | `/health` returns `{ status: 'ok', timestamp: ... }`. Set health check path in Render dashboard to `/health`. |
| **Port Binding** | **[Verified]** | Configured to bind on `process.env.PORT || 5000` (Render default is 10000 or specified via env var). |
| **Graceful Shutdown** | **[Verified]** | `src/server.js` listens to `SIGTERM` and `SIGINT`, cleanly terminating background workers and draining HTTP connections. |
| **Memory Limit Configuration** | **[Verified]** | Node process runs with `--max-old-space-size=384` to prevent OOM kills on Render free/starter tiers. |

---

## 3. Name.com DNS & Domain Routing

| Item | Status | Verification & Action Details |
| :--- | :--- | :--- |
| **Apex Domain (`@`)** | **[Requires Administrator Access]** | Configure A Record pointing to Vercel's IP: `76.76.21.21` (or Name.com URL forwarding with 301 to `www.gdgrec.dev`). |
| **Subdomain (`www`)** | **[Requires Administrator Access]** | CNAME Record pointing to `cname.vercel-dns.com.` |
| **Google Search Console Verification** | **[Requires Administrator Access]** | Add TXT record on `@` with `google-site-verification=...`. |
| **SSL / HTTPS Certificates** | **[Requires Administrator Access]** | Vercel automatically provisions Let's Encrypt certificates once DNS propagates. Confirm automated renewal is active. |

---

## 4. Supabase Database & Security

| Item | Status | Verification & Action Details |
| :--- | :--- | :--- |
| **Row Level Security (RLS)** | **[Verified]** | Enabled on `events`, `forms`, `form_submissions`, `certificates`, `profiles`, `admin_whitelist`. |
| **Security Hardening SQL** | **[Verified]** | `GDG-Backend/supabase/migrations/20261016_security_hardening.sql` applied. Enforces strict student profile boundaries, immutable submission records, and privilege check triggers. |
| **Service Role Secret Isolation** | **[Verified]** | Backend uses `SUPABASE_SERVICE_ROLE_KEY` internally in server environments; never bundled into frontend assets. |
| **Database Connection Pooling** | **[Requires Administrator Access]** | Ensure Supabase connection pooling (port 6543 / PgBouncer) is utilized if scaling beyond serverless instances. |

---

## 5. Google Cloud Console & Google OAuth

| Item | Status | Verification & Action Details |
| :--- | :--- | :--- |
| **Authorized JavaScript Origins** | **[Requires Administrator Access]** | In Google Cloud Console Credentials, ensure Authorized Origins includes `https://www.gdgrec.dev` and `https://gdgrec.dev`. |
| **Authorized Redirect URIs** | **[Requires Administrator Access]** | Must include: `https://www.gdgrec.dev/auth/callback` and `https://gdg-backend-54mp.onrender.com/api/auth/google/callback`. |
| **Gmail API OAuth Refresh Token** | **[Verified]** | `GMAIL_REFRESH_TOKEN` tested and functional; sends student email verifications and password reset recovery tokens. |

---

## 6. Google Search Console & Discovery

| Item | Status | Verification & Action Details |
| :--- | :--- | :--- |
| **Robots.txt Availability** | **[Fixed & Tested]** | `public/robots.txt` tested; disallows private routes, declares canonical sitemap. |
| **Sitemap Submission** | **[Requires Administrator Access]** | Submit `sitemap.xml` in GSC dashboard after domain ownership verification. |
| **URL Inspection** | **[Requires Administrator Access]** | Inspect `https://www.gdgrec.dev/` to confirm Googlebot renders primary `<h1>` and content without errors. |

---

## 7. Operational Monitoring & Logging

| Item | Status | Verification & Action Details |
| :--- | :--- | :--- |
| **Frontend Error Boundaries** | **[Verified]** | React Error Boundaries wrap route components to catch render crashes gracefully. |
| **Backend Structured Logging** | **[Verified]** | `src/server.js` logs sanitized request methods, status codes, and latencies without leaking passwords, tokens, or ticket QR hashes. |
| **Sentry / Uptime Monitoring** | **[Requires Administrator Access]** | (Recommended) Configure an external uptime ping (e.g. BetterStack or UptimeRobot) targeting `https://gdg-backend-54mp.onrender.com/health` every 5 minutes to prevent cold-start idling on Render free tiers. |

---

## 8. Final Release Sign-Off Checklist

- [x] All 6 SEO, heading hierarchy, and robots tests passing (`npm test` in frontend).
- [x] Production bundle successfully built with Vite (`dist/` generated, 0 build errors).
- [x] All 150 backend unit, security, and auth tests passing (`npm test` in `GDG-Backend`).
- [x] Hero section converted to semantic `<h1>` while preserving 100% of visual design and animations.
- [x] Preloader bot-bypass operational for immediate crawler indexing.
- [x] Vercel CSP updated with backend origin and edge cache headers.
- [ ] Admin submits domain TXT verification in Name.com DNS.
- [ ] Admin submits `sitemap.xml` in Google Search Console.
- [ ] Admin verifies production environment variables in Vercel & Render dashboards.
