# GDG On Campus REC — SEO & Search Indexing Checklist

**Target Domain:** `https://www.gdgrec.dev`  
**Audit & Remediation Date:** October 16, 2026  
**Auditor:** Senior Frontend Performance & Technical SEO Engineering  
**Scope:** Crawlability, Heading Architecture, Metadata, XML Sitemap, Robots Directives, Google Search Console Setup, and Microdata Structured Schemas.

---

## 1. Robots.txt Configuration

- **Location:** `public/robots.txt` (Served at `https://www.gdgrec.dev/robots.txt`)
- **Verification Status:** **VERIFIED & SECURED**
- **Crawler Directives Verified:**
  - `User-agent: *`: Applies universal crawl rules to Googlebot, Bingbot, and modern web crawlers.
  - **Disallowed Private Routes:**
    - `Disallow: /admin`
    - `Disallow: /dashboard`
    - `Disallow: /profile`
    - `Disallow: /api`
  - **Allowed Public Routes:**
    - `Allow: /`
    - `Allow: /events`
    - `Allow: /team`
    - `Allow: /about-us`
    - `Allow: /resources`
    - `Allow: /tools`
  - **Canonical Sitemap Directive:**
    - `Sitemap: https://www.gdgrec.dev/sitemap.xml`
- **Crawler Rendering Safety:**
  - CSS and JS assets located in `/assets/` are not blocked, allowing search engines to execute and render visual layouts faithfully.
  - No secret tokens, scanner secrets, or private staging URLs are leaked in comments or path declarations.

---

## 2. XML Sitemap Configuration

- **Location:** `public/sitemap.xml` (Served at `https://www.gdgrec.dev/sitemap.xml`)
- **Verification Status:** **VERIFIED & REFRESHED (2026-10-16)**
- **Canonical Routing & Protocol:**
  - 100% of sitemap URLs strictly use `https://www.gdgrec.dev/` as their base.
  - No preview URLs (`*.vercel.app`), local origins (`localhost`), or transient query strings are included.
  - Disallowed administrative and private dashboard routes are strictly excluded.
- **Audited Public Routes Included:**

| URL | Priority | Change Frequency | Last Modified |
| :--- | :--- | :--- | :--- |
| `https://www.gdgrec.dev/` | 1.0 | Daily | 2026-10-16 |
| `https://www.gdgrec.dev/events` | 0.9 | Daily | 2026-10-16 |
| `https://www.gdgrec.dev/tools` | 0.8 | Weekly | 2026-10-16 |
| `https://www.gdgrec.dev/resources` | 0.8 | Weekly | 2026-10-16 |
| `https://www.gdgrec.dev/team` | 0.7 | Monthly | 2026-10-16 |
| `https://www.gdgrec.dev/about-us` | 0.6 | Monthly | 2026-10-16 |

---

## 3. Canonical URLs & Query Sanitization

- **Component:** `src/components/common/SEO.tsx`
- **Verification Status:** **FIXED & TESTED**
- **Sanitization Logic:**
  - Strips transient filter queries (e.g. `?tab=videos`, `?tag=ml`), pagination query strings, and campaign trackers (`?utm_source=...`) from canonical `<link rel="canonical">` tags.
  - Normalizes trailing slashes to eliminate dual-indexing (`/events/` vs `/events`).
  - Eliminates competing canonical headers by centralizing tag updates into a singleton manager in `<head>`.
  - Guarantees canonicals point exclusively to `https://www.gdgrec.dev/...`.

---

## 4. Single Visible Primary H1 Heading Audit

Every public route was audited and verified to contain **exactly one visible, primary `<h1>` element**. Hidden duplicate `sr-only` headings were removed and semantic markup was applied without disrupting visual typography or animations.

| Route | Component | Primary H1 Content / Accessible Label | Visual Integrity |
| :--- | :--- | :--- | :--- |
| `/` (Homepage) | `src/components/HeroSection.tsx` | `GOOGLE DEVELOPER GROUPS` (`aria-label="Google Developer Groups On Campus — REC"`) | Preserved 100% of clamp typography, mouse parallax, and color tokens. Removed duplicate hidden `sr-only` h1. |
| `/events` | `src/components/events/EventsHero.tsx` | `TECH WORKSHOPS & HACKATHONS` | Preserved motion springs and highlight accents. |
| `/events/:id` | `src/pages/EventDetailPage.tsx` | `{event.title}` (Dynamic Event Title) | Clean hierarchy with subheadings for event schedule, speakers, and venue. |
| `/tools` | `src/components/tools/ToolsHero.tsx` | `Google Developer Tools Hub` | Preserved gradient accents and badge pills. |
| `/resources` | `src/components/resources/ResourcesHero.tsx` | `Developer Academy & Knowledge Hub` | Preserved animated gradients and track jump filters. |
| `/about-us` | `src/pages/AboutUsPage.tsx` | `Google Developer Groups (GDG) On Campus at Rajalakshmi Engineering College` | Converted hero display title to semantic `<motion.h1>`. |
| `/team` | `src/pages/TeamPage.tsx` | `CORE TEAM` | Preserved responsive glow and restricted access badge. |
| `404` | `src/pages/NotFound.tsx` | `Page Not Found` | Preserved glitch animation and return CTA. |

---

## 5. React / Vite Crawlability & Rendering Optimization

- **Preloader Bot Bypass:**
  - Updated `src/components/Preloader.tsx` to detect search engine crawlers (`Googlebot`, `Bingbot`, `crawler`, `spider`, `lighthouse`) and users with `prefers-reduced-motion`.
  - For crawlers, the 500ms terminal simulation animation is bypassed instantly, rendering the full DOM and primary H1 into the initial render tree with zero delay.
- **Initial HTML Prerendering:**
  - `index.html` contains static Schema.org JSON-LD (`WebSite` and `Organization`) and fallback title/meta descriptions, ensuring crawlers without JavaScript execution still capture brand identity.

---

## 6. Event Schema & Microdata Validation

- **Component:** `src/pages/EventDetailPage.tsx` + `src/components/common/SEO.tsx`
- **Schema Type:** `https://schema.org/Event`
- **Fields Injected:**
  - `@context`: `https://schema.org`
  - `@type`: `Event`
  - `name`: Clean event title
  - `description`: Event overview and abstract
  - `startDate`: ISO 8601 formatted event start date/time
  - `endDate`: ISO 8601 formatted event completion date/time
  - `eventAttendanceMode`: `https://schema.org/OfflineEventAttendanceMode` / `OnlineEventAttendanceMode`
  - `eventStatus`: `https://schema.org/EventScheduled`
  - `location`: Structured `Place` with REC venue details
  - `organizer`: Organization schema referencing `GDG on Campus REC`
- **Privacy Protections:**
  - Attendee emails, tickets, participant rosters, and private QR verification hashes are **strictly excluded** from structured data and public HTML.

---

## 7. Google Search Console Setup & Administrator Runbook

The following actions must be performed by the domain administrator in Google Search Console:

### Step 1: Domain Property Verification
1. Navigate to [Google Search Console](https://search.google.com/search-console).
2. Choose **Domain Property** (covers `https://www.gdgrec.dev`, `https://gdgrec.dev`, subdomains, and protocols).
3. Copy the TXT verification record provided by Google (e.g., `google-site-verification=...`).
4. Log into the DNS provider (**Name.com**) and add a TXT record on the apex domain (`@`) with TTL 300.
5. In Search Console, click **Verify**. (Verification typically takes 2–10 minutes).

### Step 2: Submit Sitemap
1. Under **Indexing** in the left sidebar, click **Sitemaps**.
2. Under "Add a new sitemap", enter: `sitemap.xml`.
3. Click **Submit**. Verify status changes to **Success**.

### Step 3: Inspect Homepage & Public URLs
1. In the top URL Inspection bar, enter: `https://www.gdgrec.dev/`.
2. Click **Test Live URL**.
3. Inspect:
   - "URL is available to Google"
   - "Page fetch: Successful"
   - "Crawled as: Googlebot smartphone"
   - Rendered screenshot shows the primary `<h1>` and hero content.
4. Click **Request Indexing**.
5. Repeat for:
   - `https://www.gdgrec.dev/events`
   - `https://www.gdgrec.dev/team`
   - `https://www.gdgrec.dev/tools`
   - `https://www.gdgrec.dev/resources`
   - `https://www.gdgrec.dev/about-us`

### Step 4: Monitor Core Web Vitals & Indexing Reports
1. **Pages Report:** Check for any "Excluded" pages; ensure `/admin`, `/dashboard`, and `/profile` are intentionally excluded via `robots.txt` or `noindex`.
2. **Core Web Vitals:** Monitor mobile and desktop performance reports as field traffic accumulates.
3. **HTTPS Report:** Confirm all indexed URLs report valid HTTPS status.

---

## 8. Verification Suite Results

Run the automated test runner:
```bash
npm run test:seo
```
**Results:**
- `public/robots.txt` directives: **PASS**
- `public/sitemap.xml` canonical URLs & route coverage: **PASS**
- Single visible primary H1 per public route: **PASS**
- Canonical URL sanitization (query param stripping): **PASS**
- Preloader bot bypass: **PASS**
- Vercel cache headers for sitemap/robots/HTML: **PASS**
