# GSurf Website Revamp — Final Deliverable

**Client:** Gaxiom Networking Solutions Pvt Ltd
**Brand:** GSurf (https://www.gsurf.in)
**Deliverable:** Full static website + documentation + SEO audit + developer notes
**Scope:** Revamp proposal, intended for GitHub Pages static hosting with optional
Firebase Firestore integration for contact form submissions.

---

## What's in this package

```
gsurf-v4/
│
│  ── 16 website pages ──
├── index.html                   Homepage
├── enterprise.html              Enterprise plans (9 tiers + features + FAQ)
├── coverage.html                Coverage map (9 neighbourhood cards)
├── home-broadband.html          Residential (de-emphasized)
├── about.html                   Company background
├── contact.html                 Contact & book survey
│
├── software-companies.html      ICP 1 of 6 — Software teams
├── schools.html                 ICP 2 of 6 — Schools & institutions
├── hospitals.html               ICP 3 of 6 — Hospitals & clinics
├── smes.html                    ICP 4 of 6 — SMEs
├── coworking.html               ICP 5 of 6 — Coworking spaces
├── manufacturing.html           ICP 6 of 6 — Manufacturing units
│
├── whitefield.html              Neighbourhood — 560066
├── brookefield.html             Neighbourhood — 560037 (Brookefield/Marathahalli)
├── itpl.html                    Neighbourhood — 560048 (ITPL/Hoodi)
├── mahadevapura.html            Neighbourhood — 560016 (Mahadevapura/KR Puram)
│
│  ── 2 client-facing documentation pages ──
├── seo-audit.html               Comprehensive SEO/AEO/GEO audit report
├── dev-notes.html               Developer notes with content source attribution
│
│  ── Supporting files ──
├── 404.html                     Custom error page (noindex)
├── styles.css                   Shared design system (navy blue, IBM Plex fonts)
├── favicon.svg                  Primary SVG favicon
├── favicon-32x32.png            PNG fallback
├── apple-touch-icon.png         iOS home screen icon
├── android-chrome-192x192.png   Android launch icon
├── android-chrome-512x512.png   Android launch icon (high-res)
├── site.webmanifest             PWA manifest
├── robots.txt                   Crawler rules (AI bots explicitly allowed)
├── sitemap.xml                  XML sitemap, 16 URLs with priority ranking
├── .nojekyll                    Prevents GitHub Pages Jekyll processing
│
│  ── Firebase integration ──
├── firebase-form.js             Contact form → Firestore handler (client JS)
├── firestore.rules              Server-side validation rules
├── FIREBASE_SETUP.md            Step-by-step setup guide for client
│
└── README.md                    This file
```

Total: 33 files (19 HTML + 7 images + 7 configuration/code)

---

## Deployment — what Kumar needs to do

### 1 · Push to GitHub
```
git init
git add .
git commit -m "Initial GSurf v4 site"
git remote add origin https://github.com/YOUR_ORG/gsurf-site.git
git push -u origin main
```

### 2 · Enable GitHub Pages
In the repo → Settings → Pages:
- Source: **Deploy from a branch**
- Branch: **main** / `/` (root)
- Save

GitHub will serve the site at `https://YOUR_ORG.github.io/gsurf-site`

### 3 · Add custom domain
In Settings → Pages → Custom domain:
- Enter `www.gsurf.in`
- Check "Enforce HTTPS"

Add DNS records at your domain registrar (Hostinger/Cloudflare/etc):
- `www` CNAME → `YOUR_ORG.github.io`
- Apex `gsurf.in` → 4 A records for GitHub Pages
  - `185.199.108.153`
  - `185.199.109.153`
  - `185.199.110.153`
  - `185.199.111.153`

### 4 · Set up Firebase (see FIREBASE_SETUP.md)
Create the Firebase project, enable Firestore in `asia-south1` (Mumbai),
paste the `firebaseConfig` into `firebase-form.js`, deploy the rules from
`firestore.rules`. Full 8-step guide in FIREBASE_SETUP.md.

### 5 · Post-launch SEO tasks (see seo-audit.html)
- Claim Google Business Profile at business.google.com
- Verify ownership in Google Search Console
- Submit `/sitemap.xml` to Search Console
- Run homepage + enterprise.html + whitefield.html through
  https://search.google.com/test/rich-results

### 6 · Review placeholder content (see dev-notes.html)
13 placeholder claims flagged in red in dev-notes.html — confirm or
replace with the client before public announce.

---

## Two client-facing documents

### SEO Audit Report — `/seo-audit.html`
Comprehensive audit of the previous live site with 12 findings, before/after
scorecards, implementation summary, schema deployment table, and projected
impact timeline across SEO / AEO / GEO channels.

Use this to show the client *what was wrong and what we fixed*.

### Developer Notes — `/dev-notes.html`
Detailed page-by-page content source attribution. Every section of every
page is categorised as:
- **Direct from live site** (35% — prices, addresses, contact info, plan structure)
- **Industry standard** (20% — what FTTH is, what SLA means, what VLAN does)
- **AI-structured from source** (35% — marketing framing built from live-site facts)
- **Placeholder needs confirmation** (10% — customer counts, latency claims)

Use this to show the client *we are not inventing content — everything is sourced*.
Also acts as a pre-launch checklist of what needs client confirmation.

---

## Design system summary

**Typography:** IBM Plex Sans (body) + IBM Plex Mono (technical labels, pincodes, UI metadata)
**Primary colour:** Navy `#123d7a` — corporate, serious, enterprise-grade
**Aesthetic:** Clean white surfaces with navy-50 section backgrounds — IBM / Cisco / Bloomberg territory
**No emoji anywhere** — all icons are inline SVG
**Feel:** B2B infrastructure company, not design studio

---

## Search Optimization summary

### Traditional SEO
- Unique title and meta description per page
- Canonical URLs pointing to absolute URLs on `https://www.gsurf.in`
- robots meta + language + locale tags
- Semantic HTML: one H1 per page, proper hierarchy
- sitemap.xml with priority ranking
- robots.txt with Sitemap reference

### AEO — Answer Engine Optimization
- robots.txt explicitly allows GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended, anthropic-ai
- FAQPage JSON-LD + matching visible HTML on 11 pages (49 Q&As total)
- Open Graph + Twitter Card tags

### GEO — Generative Engine Optimization
- Organization + LocalBusiness (InternetServiceProvider subtype) JSON-LD on every page
- GeoCoordinates with exact lat/lng for HQ
- areaServed schema with 7 pincodes
- Place + GeoCoordinates schema on every neighbourhood page
- BreadcrumbList schema below homepage

Total structured data: 49 validated JSON-LD blocks across 16 pages.

---

## Contact form → Firebase flow

When a user submits the site survey form:

1. Client-side JS validates required fields, 6-digit pincode, email format
2. Submit button disables, text changes to "Submitting..."
3. Document is written to Firestore collection `site_surveys` with:
   - All form fields (name, company, phone, email, address, pincode, segment, team size, notes)
   - Server-side submittedAt timestamp
   - Source metadata (which page, referrer URL, user agent)
   - Status: 'new'
4. On success: green banner appears, form resets, scrolls into view
5. On error: red banner appears, form stays filled so user can retry

Firestore security rules strictly validate incoming documents server-side:
length caps, regex for pincode/email, no extra fields accepted, status
locked to 'new', reads/updates/deletes denied from client. Admin review
happens via Firebase Console → Firestore Data tab.

See FIREBASE_SETUP.md for complete setup instructions.

---

## File sizes

Total uncompressed: ~600 KB (33 files)
Compressed (zip): ~140 KB

Site is static — no build step, no npm, no framework. Anyone can open the
files and edit them with a text editor.
